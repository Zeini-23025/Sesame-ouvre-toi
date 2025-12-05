import { Keyboard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const RhythmAuth = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [keysPressed, setKeysPressed] = useState([]);
  const [status, setStatus] = useState('');

  const keyTimingsRef = useRef([]);
  const lastKeyTimeRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const interval = lastKeyTimeRef.current ? currentTime - lastKeyTimeRef.current : 0;

      keyTimingsRef.current.push({
        key: e.key,
        time: currentTime,
        interval: interval
      });

      lastKeyTimeRef.current = currentTime;
      setKeysPressed(prev => [...prev, e.key === ' ' ? '␣' : e.key]);

      if (keyTimingsRef.current.length >= 8) {
        processRhythmPattern();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, patterns]);

  const processRhythmPattern = () => {
    if (keyTimingsRef.current.length < 8) {
      setStatus('❌ Passphrase too short (min 8 characters)');
      return;
    }

    const intervals = keyTimingsRef.current.slice(1).map(k => k.interval);
    const rhythmPattern = {
      length: keyTimingsRef.current.length,
      avgInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      variance: calculateVariance(intervals),
      sequence: keyTimingsRef.current.map(k => k.key).join('')
    };

    if (mode === 'register') {
      window.storage.set('auth_rhythm', JSON.stringify(rhythmPattern));
      setPatterns(prev => ({ ...prev, rhythm: rhythmPattern }));
      setStatus('✅ Typing rhythm saved!');
      setTimeout(() => {
        setAuthMethod(null);
        setStatus('');
        setKeysPressed([]);
      }, 2000);
    } else if (mode === 'login') {
      verifyRhythmPattern(rhythmPattern);
    }
  };

  const calculateVariance = (numbers) => {
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  };

  const verifyRhythmPattern = (newPattern) => {
    if (!patterns.rhythm) {
      setStatus('❌ No rhythm pattern registered');
      return;
    }

    const p = patterns.rhythm;
    const sequenceMatch = newPattern.sequence === p.sequence;
    const intervalMatch = Math.abs(newPattern.avgInterval - p.avgInterval) / p.avgInterval < 0.3;
    const varianceMatch = Math.abs(newPattern.variance - p.variance) / p.variance < 0.4;

    const score = [sequenceMatch, intervalMatch, varianceMatch].filter(Boolean).length;

    checkAuthSuccess('rhythm', score >= 2 && sequenceMatch);
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
        setKeysPressed([]);
      }, 3500);
    } else {
      setStatus('❌ Pattern incorrect. Ali Baba does not recognize you!');
      setTimeout(() => {
        setStatus('');
        setKeysPressed([]);
      }, 2500);
    }
  };

  return (
    <div className="auth-interface">
      <h2>⌨️ {mode === 'register' ? 'Rhythm Registration' : 'Rhythm Login'}</h2>
      <div className="keyboard-display">
        <Keyboard size={96} className="keyboard-icon" />
        <div className="keys-display">
          {keysPressed.map((key, i) => (
            <span key={i} className="key-pressed" style={{
              animationDelay: `${i * 0.05}s`
            }}>{key}</span>
          ))}
          {keysPressed.length === 0 && (
            <span className="placeholder-text">Start typing...</span>
          )}
        </div>
      </div>
      <p className="instruction">Type your secret passphrase (minimum 8 characters)</p>
      {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default RhythmAuth;
