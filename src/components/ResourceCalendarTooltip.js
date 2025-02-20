import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const ResourceCalendarTooltip = ({ dato, hendelser }) => {
  if (hendelser.length === 0) return null;

  return (
    <div className="hendelser-tooltip">
      <div className="tooltip-header">
        {format(dato, 'dd.MM.yyyy')}
      </div>
      <div className="tooltip-content">
        {hendelser.map((hendelse, idx) => (
          <div key={idx} className="hendelse">
            <span className="hendelse-tid">
              {hendelse.start}-{hendelse.slutt}
            </span>
            <span className="hendelse-tittel">
              {hendelse.tittel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceCalendarTooltip; 