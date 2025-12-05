import { Palette } from 'lucide-react';
import { useState } from 'react';

const ColorBlenderAuth = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [red, setRed] = useState(128);
  const [green, setGreen] = useState(128);
  const [blue, setBlue] = useState(128);
  const [status, setStatus] = useState('');

  const currentColor = `rgb(${red}, ${green}, ${blue})`;
  const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;

  const handleSubmit = async () => {
    const colorData = { red, green, blue };

    if (mode === 'register') {
      try {
        if (window.storage && typeof window.storage.set === 'function') {
          await window.storage.set('auth_color', JSON.stringify(colorData));
        }
        setPatterns(prev => ({ ...prev, color: colorData }));
        setStatus('✅ Your unique color has been saved!');
        setTimeout(() => {
          setAuthMethod(null);
          setStatus('');
        }, 2000);
      } catch (error) {
        setStatus('❌ Error saving color');
        console.error('Storage error:', error);
      }
    } else if (mode === 'login') {
      verifyColor(colorData);
    }
  };

  const verifyColor = (newColor) => {
    if (!patterns.color) {
      setStatus('❌ No color pattern registered');
      return;
    }

    // Calculate color difference (Delta E simplified)
    const deltaR = Math.abs(newColor.red - patterns.color.red);
    const deltaG = Math.abs(newColor.green - patterns.color.green);
    const deltaB = Math.abs(newColor.blue - patterns.color.blue);

    // Average difference across all channels
    const colorDifference = (deltaR + deltaG + deltaB) / 3;

    // Allow tolerance of 15 units per channel on average
    const tolerance = 15;
    const match = colorDifference <= tolerance;

    checkAuthSuccess('color', match);
  };

  const checkAuthSuccess = (method, success) => {
    if (success) {
      setStatus('✨ SESAME OPEN! ✨');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setMode('welcome');
        setStatus('');
        setAuthMethod(null);
      }, 3500);
    } else {
      setStatus('❌ Color incorrect. Ali Baba does not recognize this shade!');
      setTimeout(() => {
        setStatus('');
      }, 2500);
    }
  };

  const randomizeColor = () => {
    setRed(Math.floor(Math.random() * 256));
    setGreen(Math.floor(Math.random() * 256));
    setBlue(Math.floor(Math.random() * 256));
  };

  return (
    <div className="auth-interface">
      <h2>🎨 {mode === 'register' ? 'Create Your Color' : 'Recreate Your Color'}</h2>

      <div className="color-display" style={{ backgroundColor: currentColor }}>
        <div className="color-info">
          <Palette size={64} />
          <div className="color-values">
            <span className="hex-value">{hexColor.toUpperCase()}</span>
            <span className="rgb-value">RGB({red}, {green}, {blue})</span>
          </div>
        </div>
      </div>

      <div className="color-sliders">
        <div className="slider-group">
          <label>
            <span className="slider-label" style={{ color: '#ff6b6b' }}>Red</span>
            <span className="slider-value">{red}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={red}
            onChange={(e) => setRed(parseInt(e.target.value))}
            className="slider slider-red"
            style={{
              background: `linear-gradient(to right, rgb(0,${green},${blue}), rgb(255,${green},${blue}))`
            }}
          />
        </div>

        <div className="slider-group">
          <label>
            <span className="slider-label" style={{ color: '#4ecdc4' }}>Green</span>
            <span className="slider-value">{green}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={green}
            onChange={(e) => setGreen(parseInt(e.target.value))}
            className="slider slider-green"
            style={{
              background: `linear-gradient(to right, rgb(${red},0,${blue}), rgb(${red},255,${blue}))`
            }}
          />
        </div>

        <div className="slider-group">
          <label>
            <span className="slider-label" style={{ color: '#8a2be2' }}>Blue</span>
            <span className="slider-value">{blue}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={blue}
            onChange={(e) => setBlue(parseInt(e.target.value))}
            className="slider slider-blue"
            style={{
              background: `linear-gradient(to right, rgb(${red},${green},0), rgb(${red},${green},255))`
            }}
          />
        </div>
      </div>

      <button onClick={randomizeColor} className="btn-action btn-randomize">
        🎲 Random Color
      </button>

      <button onClick={handleSubmit} className="btn-submit">
        {mode === 'register' ? '✨ Save My Color' : '🔓 Unlock'}
      </button>

      <p className="instruction">
        {mode === 'register'
          ? 'Mix your unique color using the RGB sliders'
          : 'Recreate your color to unlock the cave'}
      </p>

      {status && (
        <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>
          {status}
        </p>
      )}

      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default ColorBlenderAuth;
