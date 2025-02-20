import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addWeeks, startOfWeek, addDays, isWeekend, getWeek, isWithinInterval } from 'date-fns';
import { nb } from 'date-fns/locale';
import ResourceCalendarTooltip from './ResourceCalendarTooltip';
import ColorLegend from './ColorLegend';
import CourseCalendar from './CourseCalendar';
import PrognoseDialog from './PrognoseDialog';

const ansatte = [
  { navn: 'Bjørn', epost: 'bjornu@leancommunications.no' },
  { navn: 'Jørn', epost: 'jornt@leancommunications.no' },
  { navn: 'Terje', epost: 'terjel@leancommunications.no' },
  { navn: 'Lasse', epost: 'lasser@leancommunications.no' }
];
const antallUker = 15;
const dagBokstaver = ['M', 'T', 'O', 'T', 'F'];

const ResourceCalendar = ({ graphClient }) => {
  const [kalenderData, setKalenderData] = useState({});
  const [laster, setLaster] = useState(true);
  const [antallUkerValgt, setAntallUkerValgt] = useState(15);
  const [visningsType, setVisningsType] = useState('timer');
  const [manuelleVerdier, setManuelleVerdier] = useState({});
  const [aktivDialog, setAktivDialog] = useState(null);
  const [fullKalenderData, setFullKalenderData] = useState({});

  const getStartDato = useCallback(() => {
    // Start fra første arbeidsdag i uke 6, 2025 (mandag 3. februar)
    return new Date(2025, 1, 3); // Merk: måneder er 0-basert, så 1 er februar
  }, []);

  const getUkeDatoer = (startDato, antallUker) => {
    // Start direkte fra startdatoen siden vi nå vet at det er en mandag
    const start = startDato;
    const datoer = [];
    
    for (let uke = 0; uke < antallUker; uke++) {
      const ukeStart = addWeeks(start, uke);
      const ukeDatoer = [];
      
      for (let dag = 0; dag < 5; dag++) {
        ukeDatoer.push(addDays(ukeStart, dag));
      }
      
      datoer.push(ukeDatoer);
    }
    
    return datoer;
  };

  const hentKalenderData = async () => {
    setLaster(true);
    const startDato = getStartDato();
    const sluttDato = addWeeks(startDato, antallUkerValgt);
    
    try {
      const alleData = {};
      
      for (const ansatt of ansatte) {
        console.log('Prøver å hente data for:', ansatt.navn);
        
        const bruker = await hentBrukerInfo(ansatt);
        console.log('Brukerinfo for', ansatt.navn, ':', bruker);
        
        if (bruker) {
          console.log('Henter kalenderhendelser for:', bruker.displayName);
          const hendelser = await hentKalenderHendelser(bruker.id, startDato, sluttDato);
          console.log('Kalenderhendelser for', ansatt.navn, ':', hendelser.length, 'hendelser');
          alleData[ansatt.navn] = hendelser;
        }
      }
      
      setFullKalenderData(alleData);
    } catch (error) {
      console.error('Feil ved henting av kalenderdata:', error);
    }
    
    setLaster(false);
  };

  const hentBrukerInfo = async (ansatt) => {
    try {
      const resultat = await graphClient.api(`/users/${ansatt.epost}/calendar`)
        .get();
      return { id: resultat.owner.address, displayName: ansatt.navn };
    } catch (error) {
      try {
        const delte = await graphClient.api('/me/calendars')
          .get();
        const kalender = delte.value.find(k => 
          k.owner?.address?.toLowerCase() === ansatt.epost.toLowerCase()
        );
        if (kalender) {
          return { id: kalender.owner.address, displayName: ansatt.navn };
        }
      } catch (innerError) {
        console.error(`Feil ved henting av delte kalendere for ${ansatt.navn}:`, innerError);
      }
      console.error(`Feil ved henting av brukerinfo for ${ansatt.navn}:`, error);
      return null;
    }
  };

  const hentKalenderHendelser = async (brukerId, start, slutt) => {
    try {
      console.log(`Henter hendelser for ${brukerId} fra ${start.toLocaleDateString()} til ${slutt.toLocaleDateString()}`);
      
      const resultat = await graphClient.api(`/users/${brukerId}/calendar/calendarView`)
        .query({
          startDateTime: start.toISOString(),
          endDateTime: slutt.toISOString(),
          $top: 999
        })
        .header('Prefer', 'outlook.timezone="Europe/Oslo"')
        .select('subject,start,end,showAs,attendees')
        .orderby('start/dateTime')
        .get();
        
      let hendelser = resultat.value;
      let nextLink = resultat['@odata.nextLink'];
      
      while (nextLink) {
        const nesteResultat = await graphClient.api(nextLink).get();
        hendelser = [...hendelser, ...nesteResultat.value];
        nextLink = nesteResultat['@odata.nextLink'];
      }
      
      console.log(`Fant totalt ${hendelser.length} hendelser`);
      return hendelser;
    } catch (error) {
      try {
        const delte = await graphClient.api('/me/calendars')
          .get();
        const kalender = delte.value.find(k => 
          k.owner?.address?.toLowerCase() === brukerId.toLowerCase()
        );
        if (kalender) {
          const resultat = await graphClient.api(`/me/calendars/${kalender.id}/calendarView`)
            .query({
              startDateTime: start.toISOString(),
              endDateTime: slutt.toISOString(),
              $top: 999
            })
            .header('Prefer', 'outlook.timezone="Europe/Oslo"')
            .select('subject,start,end,showAs,attendees')
            .orderby('start/dateTime')
            .get();
            
          let hendelser = resultat.value;
          let nextLink = resultat['@odata.nextLink'];
          
          while (nextLink) {
            const nesteResultat = await graphClient.api(nextLink).get();
            hendelser = [...hendelser, ...nesteResultat.value];
            nextLink = nesteResultat['@odata.nextLink'];
          }
          
          console.log(`Fant totalt ${hendelser.length} hendelser fra delt kalender`);
          return hendelser;
        }
      } catch (innerError) {
        console.error('Feil ved henting av delte kalenderhendelser:', innerError);
      }
      console.error('Feil ved henting av kalenderhendelser:', error);
      return [];
    }
  };

  const beregnOpptattTimer = (hendelser, dato) => {
    const dagenHendelser = hendelser.filter(hendelse => {
      const hendelseDato = new Date(hendelse.start.dateTime);
      return hendelseDato.toDateString() === dato.toDateString();
    });

    const totalTimer = dagenHendelser.reduce((sum, hendelse) => {
      const start = new Date(hendelse.start.dateTime);
      const slutt = new Date(hendelse.end.dateTime);
      const varighet = (slutt - start) / (1000 * 60 * 60);
      return sum + varighet;
    }, 0);

    return totalTimer;
  };

  const formaterKlokkeslett = (datoStr) => {
    const dato = new Date(datoStr);
    return dato.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  };

  const formaterHendelser = (hendelser, dato) => {
    return hendelser
      .filter(hendelse => {
        const hendelseDato = new Date(hendelse.start.dateTime);
        return hendelseDato.toDateString() === dato.toDateString();
      })
      .map(hendelse => ({
        start: formaterKlokkeslett(hendelse.start.dateTime),
        slutt: formaterKlokkeslett(hendelse.end.dateTime),
        tittel: hendelse.subject || 'Opptatt'
      }));
  };

  const beregnFarge = (ledigTimer) => {
    if (ledigTimer <= 2) return { farge: 'rod' };
    if (ledigTimer <= 4) return { farge: 'gul' };
    if (ledigTimer <= 6) return { farge: 'lysgronn' };
    return { farge: 'gronn' };
  };

  const beregnFirmaFarge = (hendelser, dato) => {
    const dagenHendelser = hendelser.filter(hendelse => {
      const hendelseDato = new Date(hendelse.start.dateTime);
      const erFodselsdag = hendelse.subject?.toLowerCase().includes('bursdag') || 
                          hendelse.subject?.toLowerCase().includes('fødselsdag');
      return hendelseDato.toDateString() === dato.toDateString() && !erFodselsdag;
    });

    const langeHendelser = dagenHendelser.filter(hendelse => {
      const start = new Date(hendelse.start.dateTime);
      const slutt = new Date(hendelse.end.dateTime);
      const varighet = (slutt - start) / (1000 * 60 * 60);
      return varighet >= 6;
    });

    if (langeHendelser.length === 0) return '';

    for (const hendelse of langeHendelser) {
      const tittel = hendelse.subject?.toLowerCase() || '';
      const deltakere = hendelse.attendees || [];
      const emails = deltakere.map(a => a.emailAddress?.address?.toLowerCase() || '');

      if (tittel.includes('neso')) {
        return 'neso';
      }
      if (tittel.includes('rambøll') || tittel.includes('ramboll')) {
        return 'ramboll';
      }
      if (tittel.includes('inspirert')) {
        return 'inspirert';
      }
      if (tittel.includes('consto')) {
        return 'consto';
      }
      if (tittel.includes('finland') || tittel.includes('finnish')) {
        return 'lysebla';
      }
      if (tittel.includes('westend') || tittel.includes('bakeri')) {
        return 'westend';
      }
      if (tittel.includes('bane nor') || tittel.includes('banenor')) {
        return 'bla';
      }
      if (tittel.includes('forsvarsbygg')) {
        return 'firmagronn';
      }
      if (tittel.includes('af') || tittel.includes('af bf')) {
        return 'knallgul';
      }
      if (tittel.includes('ellco')) {
        return 'svart';
      }

      if (emails.some(email => email.includes('.fi'))) {
        return 'lysebla';
      }
      if (emails.some(email => email.includes('@banenor.no'))) {
        return 'bla';
      }
      if (emails.some(email => email.includes('@forsvarsbygg.no'))) {
        return 'firmagronn';
      }
      if (emails.some(email => email.includes('@afgruppen.no'))) {
        return 'knallgul';
      }
      if (emails.some(email => email.includes('@ellco.no'))) {
        return 'svart';
      }
      if (emails.some(email => email.includes('@consto.no'))) {
        return 'consto';
      }
      if (emails.some(email => email.includes('@inspirert.no'))) {
        return 'inspirert';
      }
      if (emails.some(email => email.includes('@ramboll.no'))) {
        return 'ramboll';
      }
      if (emails.some(email => email.includes('@neso.no'))) {
        return 'neso';
      }
    }

    return 'lang-hendelse';
  };

  const erHelligdag = (dato) => {
    const year = dato.getFullYear();
    
    const fasteHelligdager = [
      { dato: new Date(year, 0, 1), navn: 'Nyttårsdag' },
      { dato: new Date(year, 4, 1), navn: 'Arbeidernes dag' },
      { dato: new Date(year, 4, 17), navn: 'Grunnlovsdagen' },
      { dato: new Date(year, 11, 25), navn: '1. juledag' },
      { dato: new Date(year, 11, 26), navn: '2. juledag' }
    ];

    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    const paskeSondag = new Date(year, month, day);
    
    const skjertorsdag = new Date(paskeSondag);
    skjertorsdag.setDate(paskeSondag.getDate() - 3);
    const langfredag = new Date(paskeSondag);
    langfredag.setDate(paskeSondag.getDate() - 2);
    const paskeMandag = new Date(paskeSondag);
    paskeMandag.setDate(paskeSondag.getDate() + 1);
    const kristiHimmel = new Date(paskeSondag);
    kristiHimmel.setDate(paskeSondag.getDate() + 39);
    const pinseSondag = new Date(paskeSondag);
    pinseSondag.setDate(paskeSondag.getDate() + 49);
    const pinseMandag = new Date(paskeSondag);
    pinseMandag.setDate(paskeSondag.getDate() + 50);

    const bevegeligeHelligdager = [
      { dato: skjertorsdag, navn: 'Skjærtorsdag' },
      { dato: langfredag, navn: 'Langfredag' },
      { dato: paskeSondag, navn: '1. påskedag' },
      { dato: paskeMandag, navn: '2. påskedag' },
      { dato: kristiHimmel, navn: 'Kristi himmelfartsdag' },
      { dato: pinseSondag, navn: '1. pinsedag' },
      { dato: pinseMandag, navn: '2. pinsedag' }
    ];

    const alleHelligdager = [...fasteHelligdager, ...bevegeligeHelligdager];
    
    const helligdag = alleHelligdager.find(h => 
      h.dato.getDate() === dato.getDate() && 
      h.dato.getMonth() === dato.getMonth()
    );

    return helligdag ? helligdag.navn : null;
  };

  const beregnPrognose = useCallback((hendelser, dato, ansattNavn) => {
    const celleId = `${ansattNavn}-${format(dato, 'yyyy-MM-dd')}`;
    const manuellVerdi = manuelleVerdier[celleId];
    
    if (manuellVerdi !== undefined) {
      return {
        sum: manuellVerdi,
        tekst: manuellVerdi === 0 ? '0' : `${Math.round(manuellVerdi/1000)}K`
      };
    }

    if (!hendelser || hendelser.length === 0) return { sum: 0, tekst: '' };
    
    const dagenHendelser = hendelser.filter(hendelse => {
      const hendelseDato = new Date(hendelse.start.dateTime);
      return hendelseDato.toDateString() === dato.toDateString();
    });

    let dagSum = 0;
    let belopTekst = '';

    for (const hendelse of dagenHendelser) {
      const start = new Date(hendelse.start.dateTime);
      const slutt = new Date(hendelse.end.dateTime);
      let hendelsesTimer = Math.ceil((slutt - start) / (1000 * 60 * 60));
      
      const tittel = hendelse.subject?.toLowerCase() || '';
      const deltakere = hendelse.attendees || [];
      const emails = deltakere.map(a => a.emailAddress?.address?.toLowerCase() || '');
      
      const erForsvarsbygg = tittel.includes('forsvarsbygg') || 
                            emails.some(email => email.includes('@forsvarsbygg.no'));
      const erBaneNor = tittel.includes('bane nor') || 
                        emails.some(email => email.includes('@banenor.no'));
      const erWestend = tittel.includes('westend') || 
                        tittel.includes('bakeri');
      const erEllco = tittel.includes('ellco') || 
                      emails.some(email => email.includes('@ellco.no'));
      const erAFBF = tittel.includes('af') || tittel.includes('af bf') ||
                     emails.some(email => email.includes('@afgruppen.no'));

      if (hendelsesTimer >= 6) {
        if (erForsvarsbygg) {
          dagSum = 40000;
          belopTekst = '40K';
          break;
        } else if (erBaneNor) {
          dagSum = 40000;
          belopTekst = '40K';
          break;
        } else if (erAFBF) {
          dagSum = 40000;
          belopTekst = '40K';
          break;
        } else if (erWestend || erEllco) {
          dagSum = 17000;
          belopTekst = '17K';
          break;
        }
      } else {
        if (erForsvarsbygg) {
          const hendelseSum = hendelsesTimer * 2200;
          dagSum += hendelseSum;
        } else if (erBaneNor) {
          const hendelseSum = hendelsesTimer * 1900;
          dagSum += hendelseSum;
        }
      }
    }

    if (dagSum > 0 && !belopTekst) {
      belopTekst = `${Math.round(dagSum/1000)}K`;
    }

    return {
      sum: dagSum,
      tekst: dagSum > 0 ? belopTekst : ''
    };
  }, [beregnOpptattTimer, manuelleVerdier]);

  const beregnUkesum = useCallback((ukeDatoer) => {
    let ukesum = 0;

    ukeDatoer.forEach(dato => {
      ansatte.forEach(ansatt => {
        const hendelser = kalenderData[ansatt.navn] || [];
        const prognose = beregnPrognose(hendelser, dato, ansatt.navn);
        ukesum += prognose.sum;
      });
    });

    return ukesum;
  }, [kalenderData, beregnPrognose]);

  const datoer = useMemo(() => 
    getUkeDatoer(getStartDato(), antallUkerValgt),
    [antallUkerValgt, getStartDato]
  );

  const beregnManedssum = useCallback((ukeDatoer) => {
    let manedssum = 0;
    const forsteDag = ukeDatoer[0];
    const maned = forsteDag.getMonth();
    const ar = forsteDag.getFullYear();
    
    // Finn alle datoer i måneden fra alle uker
    const manedsDatoer = datoer.flat().filter(dato => 
      dato.getMonth() === maned && dato.getFullYear() === ar
    );

    manedsDatoer.forEach(dato => {
      ansatte.forEach(ansatt => {
        const hendelser = kalenderData[ansatt.navn] || [];
        const prognose = beregnPrognose(hendelser, dato, ansatt.navn);
        manedssum += prognose.sum;
      });
    });

    return manedssum;
  }, [kalenderData, beregnPrognose, datoer]);

  const getFirmaFarge = (firma) => {
    switch (firma) {
      case 'bla':
        return 'bla';
      case 'firmagronn':
        return 'firmagronn';
      case 'westend':
        return 'westend';
      case 'knallgul':
        return 'knallgul';
      case 'svart':
        return 'svart';
      default:
        return '';
    }
  };

  const lagHendelseTekst = (hendelser) => {
    if (!hendelser || hendelser.length === 0) return '';
    
    return hendelser.map(hendelse => 
      `${hendelse.start} - ${hendelse.slutt}: ${hendelse.tittel}`
    ).join('\n');
  };

  const handleVisningsTypeEndring = (nyType) => {
    if (nyType !== visningsType) {
      setVisningsType(nyType);
    }
  };

  const DagCelle = React.memo(({ dato, hendelser, visningsType, ansatt }) => {
    const timer = beregnOpptattTimer(hendelser, dato);
    const dagenHendelser = formaterHendelser(hendelser, dato);
    
    const handleCelleKlikk = (e) => {
      if (visningsType === 'prognose') {
        e.stopPropagation();
        const celleId = `${ansatt.navn}-${format(dato, 'yyyy-MM-dd')}`;
        const currentPrognose = beregnPrognose(hendelser, dato, ansatt.navn);
        setAktivDialog({
          id: celleId,
          initialVerdi: manuelleVerdier[celleId] !== undefined ? manuelleVerdier[celleId] : currentPrognose.sum
        });
      }
    };
    
    return (
      <div 
        className={`dag-celle ${
          visningsType === 'timer' 
            ? beregnFarge(8 - timer).farge
            : beregnFirmaFarge(hendelser, dato)
        } ${erHelligdag(dato) ? 'helligdag' : ''}`}
        onClick={handleCelleKlikk}
      >
        {visningsType === 'prognose' ? (
          <div 
            className={`prognose-verdi ${!beregnFirmaFarge(hendelser, dato) ? 'svart-tekst' : ''}`}
          >
            {beregnPrognose(hendelser, dato, ansatt.navn).tekst}
          </div>
        ) : null}
        
        <ResourceCalendarTooltip 
          dato={dato}
          hendelser={dagenHendelser}
          ansattNavn={ansatt.navn}
          erHelligdag={erHelligdag(dato)}
        />
      </div>
    );
  });

  const lastManuelleVerdier = async () => {
    try {
      // Sjekk først om Dashbord-mappen eksisterer
      let harDashbordMappe = false;
      try {
        const mapper = await graphClient
          .api('/me/drive/root/children')
          .filter("name eq 'Dashbord'")
          .get();
        harDashbordMappe = mapper.value && mapper.value.length > 0;
      } catch (error) {
        console.log('Oppretter Dashbord-mappe...');
      }

      // Opprett mappen hvis den ikke finnes
      if (!harDashbordMappe) {
        try {
          await graphClient
            .api('/me/drive/root/children')
            .post({
              name: 'Dashbord',
              folder: {}
            });
          console.log('Dashbord-mappe opprettet');
        } catch (error) {
          console.log('Kunne ikke opprette Dashbord-mappe');
        }
        // Start med tom tilstand siden dette er første gang
        setManuelleVerdier({});
        return;
      }

      // Prøv å hente eksisterende verdier
      try {
        const response = await graphClient
          .api('/me/drive/root:/Dashbord/manuelleVerdier.json:/content')
          .get();
        
        if (response) {
          const verdier = JSON.parse(response);
          setManuelleVerdier(verdier);
          console.log('Verdier lastet');
        }
      } catch (error) {
        // Hvis filen ikke finnes, start med tom tilstand
        if (error.statusCode === 404) {
          setManuelleVerdier({});
        } else {
          console.log('Kunne ikke laste verdier, starter med tom tilstand');
          setManuelleVerdier({});
        }
      }
    } catch (error) {
      console.log('Starter med tom tilstand');
      setManuelleVerdier({});
    }
  };

  const lagreManuelleVerdier = async (verdier) => {
    try {
      await graphClient
        .api('/me/drive/root:/Dashbord/manuelleVerdier.json:/content')
        .put(JSON.stringify(verdier));
    } catch (error) {
      // Hvis feilen er at mappen ikke finnes, prøv å opprette den og lagre på nytt
      if (error.statusCode === 404) {
        try {
          await graphClient
            .api('/me/drive/root/children')
            .post({
              name: 'Dashbord',
              folder: {}
            });
          // Prøv å lagre på nytt etter at mappen er opprettet
          await graphClient
            .api('/me/drive/root:/Dashbord/manuelleVerdier.json:/content')
            .put(JSON.stringify(verdier));
        } catch (innerError) {
          console.log('Kunne ikke lagre verdier');
        }
      } else {
        console.log('Kunne ikke lagre verdier');
      }
    }
  };

  useEffect(() => {
    lastManuelleVerdier();
  }, []);

  useEffect(() => {
    if (Object.keys(manuelleVerdier).length > 0) {
      lagreManuelleVerdier(manuelleVerdier);
    }
  }, [manuelleVerdier]);

  useEffect(() => {
    hentKalenderData();
  }, [antallUkerValgt]);

  useEffect(() => {
    document.documentElement.style.setProperty('--num-weeks', antallUkerValgt);
  }, [antallUkerValgt]);

  useEffect(() => {
    const startDato = getStartDato();
    const sluttDato = addWeeks(startDato, antallUkerValgt);
    
    const filtrertData = {};
    Object.keys(fullKalenderData).forEach(ansattNavn => {
      filtrertData[ansattNavn] = fullKalenderData[ansattNavn]?.filter(hendelse => {
        const hendelseDato = new Date(hendelse.start.dateTime);
        return hendelseDato >= startDato && hendelseDato <= sluttDato;
      }) || [];
    });
    
    setKalenderData(filtrertData);
  }, [antallUkerValgt, fullKalenderData, getStartDato]);

  if (laster) {
    return <div>Laster kalenderdata...</div>;
  }

  return (
    <div className="ressurskalender">
      <div className="kontroll-panel">
        <div className="kontroll-rad">
          <div className="visningstype-velger">
            <button 
              className={`visning-knapp ${visningsType === 'timer' ? 'aktiv' : ''}`}
              onClick={() => handleVisningsTypeEndring('timer')}
            >
              Vis timer
            </button>
            <button 
              className={`visning-knapp ${visningsType === 'firmaer' ? 'aktiv' : ''}`}
              onClick={() => handleVisningsTypeEndring('firmaer')}
            >
              Vis firmaer
            </button>
            <button
              className={`visning-knapp ${visningsType === 'prognose' ? 'aktiv' : ''}`}
              onClick={() => handleVisningsTypeEndring('prognose')}
            >
              Vis prognose
            </button>
          </div>
          <div className="uke-velger">
            <label htmlFor="antallUker">Antall uker frem</label>
            <select
              id="antallUker"
              value={antallUkerValgt}
              onChange={(e) => setAntallUkerValgt(parseInt(e.target.value))}
              className="uke-select"
            >
              {[...Array(15)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'uke' : 'uker'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <ColorLegend type={visningsType} />
      <div className="kalender-grid">
        <div className="header-container">
          <div className="ansatt-navn"></div>
          {datoer.map((ukeDatoer, ukeIndex) => {
            const currentMonth = format(ukeDatoer[0], 'MMMM yyyy', { locale: nb });
            const prevMonth = ukeIndex > 0 
              ? format(datoer[ukeIndex - 1][0], 'MMMM yyyy', { locale: nb })
              : null;
            const nextMonth = ukeIndex < datoer.length - 1
              ? format(datoer[ukeIndex + 1][0], 'MMMM yyyy', { locale: nb })
              : null;
            
            const isNewMonth = currentMonth !== prevMonth;
            const isLastWeekOfMonth = currentMonth !== nextMonth;
            
            let monthSpan = 1;
            if (isNewMonth) {
              let weekIndex = ukeIndex + 1;
              while (
                weekIndex < datoer.length && 
                format(datoer[weekIndex][0], 'MMMM yyyy', { locale: nb }) === currentMonth
              ) {
                monthSpan++;
                weekIndex++;
              }
            }

            const hasMonthTransition = ukeDatoer.some((dato, index) => 
              index > 0 && dato.getMonth() !== ukeDatoer[index - 1].getMonth()
            );

            return (
              <div key={ukeIndex} className={`uke-kolonne ${hasMonthTransition ? 'month-transition' : ''}`}>
                {isNewMonth && (
                  <div 
                    className="maned-header"
                    style={{
                      width: `calc(${monthSpan} * (var(--week-width)))`,
                      borderRight: isLastWeekOfMonth ? '2px solid #333' : 'none',
                      backgroundColor: '#f5f7fa'
                    }}
                  >
                    <div className="maned-tittel">
                      {format(ukeDatoer[0], 'MMMM', { locale: nb })}
                    </div>
                    {visningsType === 'prognose' && (
                      <div className="maned-sum">
                        {new Intl.NumberFormat('nb-NO', { 
                          style: 'currency', 
                          currency: 'NOK',
                          maximumFractionDigits: 0
                        }).format(beregnManedssum(ukeDatoer))}
                      </div>
                    )}
                  </div>
                )}
                <div className="uke-header">
                  <div className="uke-nummer">
                    Uke {getWeek(ukeDatoer[0], { weekStartsOn: 1, firstWeekContainsDate: 4 })}
                  </div>
                  {visningsType === 'prognose' && (
                    <div className="uke-sum">
                      {new Intl.NumberFormat('nb-NO', { 
                        style: 'currency', 
                        currency: 'NOK',
                        maximumFractionDigits: 0
                      }).format(beregnUkesum(ukeDatoer))}
                    </div>
                  )}
                </div>
                <div className="dato-rad">
                  {ukeDatoer.map((dato, dagIndex) => (
                    <div key={dagIndex} className="dato-celle">
                      {format(dato, 'dd', { locale: nb })}
                      {erHelligdag(dato) && <div className="helligdag-markering" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {ansatte.map(ansatt => (
          <div key={ansatt.navn} className="ansatt-rad">
            <div className="ansatt-navn">{ansatt.navn}</div>
            {datoer.map((ukeDatoer, ukeIndex) => (
              <div key={ukeIndex} className="uke-gruppe">
                {ukeDatoer.map((dato, dagIndex) => (
                  <DagCelle 
                    key={dagIndex}
                    dato={dato}
                    hendelser={kalenderData[ansatt.navn] || []}
                    visningsType={visningsType}
                    ansatt={ansatt}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <CourseCalendar />
      {aktivDialog && (
        <PrognoseDialog
          isOpen={true}
          onClose={() => setAktivDialog(null)}
          onSave={async (verdi) => {
            const nyeVerdier = {
              ...manuelleVerdier,
              [aktivDialog.id]: verdi
            };
            setManuelleVerdier(nyeVerdier);
            await lagreManuelleVerdier(nyeVerdier);
            setAktivDialog(null);
          }}
          onReset={async () => {
            const nyeVerdier = { ...manuelleVerdier };
            delete nyeVerdier[aktivDialog.id];
            setManuelleVerdier(nyeVerdier);
            await lagreManuelleVerdier(nyeVerdier);
            setAktivDialog(null);
          }}
          initialValue={aktivDialog.initialVerdi}
        />
      )}
    </div>
  );
};

export default ResourceCalendar; 