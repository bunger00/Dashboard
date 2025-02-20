import React, { useState, useEffect } from 'react';
import './CourseCalendar.css';

const CourseCalendar = () => {
  const [kurs, setKurs] = useState([]);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState(null);
  const [aktivtKurs, setAktivtKurs] = useState(null);
  const [deltakere, setDeltakere] = useState({});
  const [lasterDeltakere, setLasterDeltakere] = useState(false);

  useEffect(() => {
    hentKommendeKurs();
  }, []);

  const hentKommendeKurs = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/kurs');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setKurs(data);
      setLaster(false);
    } catch (error) {
      console.error('Feil ved henting av kurs:', error);
      setFeil(error.message);
      setLaster(false);
    }
  };

  const hentDeltakere = async (kursId) => {
    if (deltakere[kursId]) return;
    
    setLasterDeltakere(true);
    try {
      const response = await fetch(`http://localhost:3005/api/kurs/${kursId}/deltakere`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDeltakere(prev => ({ ...prev, [kursId]: data }));
    } catch (error) {
      console.error('Feil ved henting av deltakere:', error);
    } finally {
      setLasterDeltakere(false);
    }
  };

  const toggleKurs = (kursId) => {
    if (aktivtKurs === kursId) {
      setAktivtKurs(null);
    } else {
      setAktivtKurs(kursId);
      hentDeltakere(kursId);
    }
  };

  if (laster) return <div className="kurs-container kurs-laster">Laster kommende kurs...</div>;
  if (feil) return <div className="kurs-container kurs-feil">Kunne ikke laste kurs: {feil}</div>;

  return (
    <div className="kurs-container">
      <h2 className="kurs-tittel">Kurskalender</h2>
      <div className="kurs-liste">
        {kurs.map(kurs => (
          <div key={kurs.coursedate_id} className="kurs-kort" onClick={() => toggleKurs(kurs.coursedate_id)}>
            <div className="kurs-header">
              <div className="kurs-dato">
                {new Date(kurs.start_at).toLocaleDateString('nb-NO')}
                <div className="kurs-tid">
                  {kurs.start_time_at.slice(0, 5)} - {kurs.end_time_at.slice(0, 5)}
                </div>
              </div>
              <div className="kurs-info">
                <div className="kurs-navn">{kurs.title}</div>
                <div className="kurs-sted">
                  {kurs.location.title} {kurs.is_virtual && '(Virtuelt)'}
                </div>
                {kurs.gatherings[0]?.instructors[0] && (
                  <div className="kurs-instruktor">
                    Instruktør: {kurs.gatherings[0].instructors[0].name}
                  </div>
                )}
              </div>
              <div className="kurs-detaljer">
                <div className="deltaker-teller">
                  {kurs.seats.booking_status.num_confirmed}/
                  {kurs.seats.allocated_capacity.num || 0}
                </div>
                <div className="kurs-pris">
                  {kurs.course.price.value} {kurs.course.price.currency}
                </div>
              </div>
            </div>
            {aktivtKurs === kurs.coursedate_id && (
              <div className="deltaker-liste">
                {lasterDeltakere ? (
                  <div className="deltaker-laster">Laster deltakere...</div>
                ) : deltakere[kurs.coursedate_id]?.length > 0 ? (
                  deltakere[kurs.coursedate_id].map(deltaker => {
                    const erAvbestilt = deltaker.status.status_code === 'status_deregistered';
                    return (
                      <div 
                        key={deltaker.id} 
                        className={`deltaker-rad ${erAvbestilt ? 'avbestilt' : ''}`}
                      >
                        <div className="deltaker-navn">
                          {deltaker.user.firstname} {deltaker.user.lastname}
                          {erAvbestilt && <span className="deltaker-status">(Avbestilt)</span>}
                        </div>
                        <div className="deltaker-firma">
                          {deltaker.user.company || '-'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="deltaker-tom">Ingen påmeldte deltakere</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseCalendar; 