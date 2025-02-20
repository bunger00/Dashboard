import React from 'react';
import confetti from 'canvas-confetti';
import './ConfettiButton.css';

const ConfettiButton = () => {
  const skytKonfetti = () => {
    // Regn av konfetti
    const antall = 500; // Øker antall partikler
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star', 'circle', 'square'],
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: antall / 3,
        scalar: 1.2,
        shapes: ['star']
      });

      confetti({
        ...defaults,
        particleCount: antall / 3,
        scalar: 0.75,
        shapes: ['circle']
      });

      confetti({
        ...defaults,
        particleCount: antall / 3,
        scalar: 1.2,
        shapes: ['square']
      });
    }

    // Skyt flere ganger for mer effekt
    shoot();
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  return (
    <button 
      className="konfetti-knapp"
      onClick={skytKonfetti}
      aria-label="Ikke rør"
    >
      Ikke rør
    </button>
  );
};

export default ConfettiButton; 