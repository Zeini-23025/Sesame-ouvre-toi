import { DoorOpen, Sparkles } from 'lucide-react';

const SuccessOverlay = () => {
  return (
    <div className="success-overlay">
      <div className="door-animation">
        <DoorOpen size={120} className="door-icon" />
        <div className="particles">
          {[...Array(50)].map((_, i) => (
            <Sparkles key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`
            }} />
          ))}
        </div>
      </div>
      <h1 className="success-text">🎉 WELCOME TO THE CAVE! 🎉</h1>
      <p className="success-subtitle">The 40 thieves tremble before you...</p>
    </div>
  );
};

export default SuccessOverlay;
