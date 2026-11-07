import React from 'react';
import Logo from './Logo.jsx';

// Carta de presentación del inicio: aparece boca abajo (reverso TCB) y se voltea
// en ~1 s para revelar el logo. No bloquea la página: todo lo demás ya está debajo.
export default function IntroCard() {
  return (
    <div className="intro-card" aria-label="The Card Box MX: tu próxima carta está aquí">
      <style>{css}</style>
      <div className="intro-card-float">
        <div className="intro-card-inner">
          {/* frente */}
          <div className="intro-face intro-front">
            <div className="intro-front-frame">
              <Logo size="78%" alt="The Card Box MX" />
              <span className="intro-front-text font-display">Tu próxima carta<br />está aquí</span>
            </div>
            <span className="intro-shine" />
          </div>
          {/* reverso */}
          <div className="intro-face intro-back" aria-hidden="true">
            <div className="intro-back-ring">
              <Logo size="70%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  .intro-card { width: clamp(150px, 38vw, 210px); aspect-ratio: 63 / 88; margin: 0 auto 28px; perspective: 1100px; }
  .intro-card-float { width: 100%; height: 100%; animation: intro-float 6s ease-in-out 1.6s infinite; }
  .intro-card-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
    animation: intro-flip 1.05s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s both; }
  .intro-face { position: absolute; inset: 0; border-radius: 12px; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(192,204,216,0.25); }
  .intro-front { background: linear-gradient(160deg, #e4ecf8, #8898b0 55%, #c0ccd8); padding: 7%; }
  .intro-front-frame { width: 100%; height: 100%; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8%;
    background: radial-gradient(circle at 50% 38%, #1a6a8a 0%, #101a2e 62%, #060608 100%); padding: 8% 6%; box-sizing: border-box; }
  .intro-front-text { color: #fff; text-align: center; font-weight: 600; font-size: clamp(12px, 3.4vw, 16px); line-height: 1.15; }
  .intro-shine { position: absolute; inset: -40%; background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
    transform: translateX(-60%); animation: intro-shine 1.4s ease 1.35s both; pointer-events: none; }
  .intro-back { transform: rotateY(180deg); background: repeating-linear-gradient(45deg, #101a2e 0 10px, #0d1117 10px 20px); padding: 8%; }
  .intro-back-ring { width: 100%; height: 100%; border-radius: 8px; border: 2px solid rgba(192,204,216,0.45); display: grid; place-items: center;
    background: radial-gradient(circle, rgba(26,106,138,0.45) 0%, transparent 70%); box-sizing: border-box; }
  @keyframes intro-flip { 0% { transform: rotateY(180deg) translateY(18px) scale(0.92); } 100% { transform: rotateY(0deg) translateY(0) scale(1); } }
  @keyframes intro-shine { 0% { transform: translateX(-60%); } 100% { transform: translateX(60%); } }
  @keyframes intro-float { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-10px) rotate(1.5deg); } }
  @media (prefers-reduced-motion: reduce) {
    .intro-card-inner, .intro-card-float, .intro-shine { animation: none; }
    .intro-shine { display: none; }
  }
`;
