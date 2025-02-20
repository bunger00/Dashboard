import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { frontcoreService } from '../services/frontcoreService';
import './CourseOverview.css';

const CourseOverview = () => {
  const [kurs, setKurs] = useState([]);
  const [laster, setLaster] = useState(true);

  useEffect(() => {
    hentNesteKurs();
  }, []);

  const hentNesteKurs = async () => {
    try {
      setLaster(true);
      const data = await frontcoreService.hentNesteKurs();
      setKurs(data);
    } catch (error) {
      console.error('Feil ved henting av kurs:', error);
    } finally {
      setLaster(false);
    }
  };

  if (laster) return <div className="laster-container">Laster kursinformasjon...</div>;

  return (
    <div className="kurs-oversikt">
      <h2>Kommende Kurs</h2>
      <div className="kurs-liste">
        {kurs.map(kurs => (
          <div key={kurs.id} className="kurs-kort">
            <div className="kurs-dato">
              {format(new Date(kurs.start_date), 'dd. MMMM yyyy', { locale: nb })}
            </div>
            <div className="kurs-innhold">
              <h3>{kurs.title}</h3>
              <div className="kurs-detaljer">
                <div className="detalj">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{kurs.location || 'Ikke spesifisert'}</span>
                </div>
                <div className="detalj">
                  <i className="fas fa-users"></i>
                  <span>
                    {kurs.participants_count || 0} / {kurs.max_participants || '-'} påmeldte
                  </span>
                </div>
                <div className="detalj">
                  <i className="fas fa-clock"></i>
                  <span>{kurs.duration || 'Ikke spesifisert'}</span>
                </div>
              </div>
            </div>
            <div className="kurs-status">
              {kurs.participants_count >= kurs.max_participants ? (
                <span className="status fullt">Fullt</span>
              ) : (
                <span className="status ledig">Ledige plasser</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseOverview; 