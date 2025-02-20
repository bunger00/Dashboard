import React from 'react';

const ColorLegend = ({ type }) => {
  if (type === 'timer') {
    return (
      <div className="farge-forklaring">
        <div className="forklaring-tittel">Tilgjengelige timer:</div>
        <div className="forklaring-grid">
          <div className="forklaring-item">
            <div className="farge-eksempel gronn"></div>
            <span>6-8 timer</span>
          </div>
          <div className="forklaring-item">
            <div className="farge-eksempel lysgronn"></div>
            <span>4-6 timer</span>
          </div>
          <div className="forklaring-item">
            <div className="farge-eksempel gul"></div>
            <span>2-4 timer</span>
          </div>
          <div className="forklaring-item">
            <div className="farge-eksempel rod"></div>
            <span>0-2 timer</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="farge-forklaring">
      <div className="forklaring-tittel">Møter over 6 timer med:</div>
      <div className="forklaring-grid">
        <div className="forklaring-item">
          <div className="farge-eksempel bla"></div>
          <span>Bane NOR</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel firmagronn"></div>
          <span>Forsvarsbygg</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel westend"></div>
          <span>Westend Bakeri</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel knallgul"></div>
          <span>AF BF</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel svart"></div>
          <span>Ellco</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel consto"></div>
          <span>Consto</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel inspirert"></div>
          <span>Inspirert</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel lang-hendelse"></div>
          <span>Andre hendelser over 6t</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel neso"></div>
          <span>Neso</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel lysebla"></div>
          <span>Finland</span>
        </div>
        <div className="forklaring-item">
          <div className="farge-eksempel ramboll"></div>
          <span>Rambøll</span>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend; 