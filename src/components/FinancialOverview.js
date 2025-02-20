import React, { useState, useEffect } from 'react';
import tripletexService from '../services/tripletexService';
import './FinancialOverview.css';

const FinancialOverview = () => {
  const [økonomData, setØkonomData] = useState(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState(null);

  useEffect(() => {
    hentØkonomiData();
  }, []);

  const hentØkonomiData = async () => {
    try {
      setLaster(true);
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Opprett sesjon først
      await tripletexService.getSession();
      
      // Hent økonomiske data
      const resultat = await tripletexService.getResultReport(year, month);
      setØkonomData(resultat);
      setLaster(false);
    } catch (error) {
      console.error('Feil ved henting av økonomidata:', error);
      setFeil(error.message);
      setLaster(false);
    }
  };

  if (laster) return <div className="økonomi-laster">Laster økonomidata...</div>;
  if (feil) return <div className="økonomi-feil">Kunne ikke laste økonomidata: {feil}</div>;

  return (
    <div className="økonomi-container">
      <h2>Økonomi Oversikt</h2>
      {/* Vis økonomiske data her */}
    </div>
  );
};

export default FinancialOverview; 