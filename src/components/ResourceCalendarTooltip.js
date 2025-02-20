import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const ResourceCalendarTooltip = ({ dato, hendelser, ansattNavn, erHelligdag }) => {
  if (hendelser.length === 0) return null;

  return (
    <div className="hendelser-tooltip">
      <div className="tooltip-header">
        {format(dato, 'EEEE d. MMMM yyyy', { locale: nb })}
        {erHelligdag && (
          <div className="helligdag-navn">{erHelligdag}</div>
        )}
      </div>
      <div className="tooltip-content">
        {hendelser.map((hendelse, index) => (
          <div key={index} className="hendelse">
            <div className="hendelse-tid">{hendelse.start} - {hendelse.slutt}</div>
            <div className="hendelse-tittel">{hendelse.tittel}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceCalendarTooltip; 