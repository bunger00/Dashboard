import React, { useState } from 'react';
import './PrognoseDialog.css';

const PrognoseDialog = ({ isOpen, onClose, onSave, initialValue, onReset }) => {
  const [verdi, setVerdi] = useState(
    initialValue !== undefined ? String(initialValue) : ''
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const numVerdi = parseFloat(verdi.replace(/[^0-9]/g, ''));
    if (!isNaN(numVerdi) || numVerdi === 0) {
      onSave(numVerdi);
      onClose();
    }
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h2>Sett prognose</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="prognose-verdi">Beløp (NOK)</label>
            <input
              id="prognose-verdi"
              type="text"
              value={verdi}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setVerdi(value);
              }}
              placeholder="F.eks. 40000"
              autoFocus
            />
            <div className="input-preview">
              {verdi === '' ? '0' : `${Math.round(parseFloat(verdi)/1000)}K`}
            </div>
          </div>
          <div className="dialog-buttons">
            <button type="button" className="btn-reset" onClick={handleReset}>
              Tilbakestill til standard
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn-save">
              Lagre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrognoseDialog; 