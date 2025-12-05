import { Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const PatternAuth = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [tapSequence, setTapSequence] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const tapTimingsRef = useRef([]);
  const firstTapTimeRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startPatternAuth();
    }

    // Cleanup on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startPatternAuth = () => {
    setStatus('🎵 Create your tap rhythm (tap anywhere 4-8 times in 5 seconds)');
    tapTimingsRef.current = [];
    firstTapTimeRef.current = null;
    setTapSequence([]);
    setIsProcessing(false);
    setCountdown(5);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          // Use setTimeout to defer the processing to avoid setState during render
          setTimeout(() => processPatternAuth(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTap = () => {
    if (countdown === null || isProcessing) return;

    const currentTime = Date.now();

    if (!firstTapTimeRef.current) {
      firstTapTimeRef.current = currentTime;
    }

    const relativeTime = currentTime - firstTapTimeRef.current;

    tapTimingsRef.current.push({
      time: relativeTime,
      timestamp: currentTime
    });

    setTapSequence(prev => [...prev, relativeTime]);

    // Visual feedback
    const tapArea = document.querySelector('.pattern-tap-area');
    if (tapArea) {
      const ripple = document.createElement('div');
      ripple.className = 'tap-ripple';
      ripple.style.left = `${Math.random() * 80 + 10}%`;
      ripple.style.top = `${Math.random() * 80 + 10}%`;
      tapArea.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  };

  const processPatternAuth = () => {
    setIsProcessing(true);

    if (tapTimingsRef.current.length < 4) {
      setStatus('❌ Not enough taps (minimum 4)');
      setTimeout(() => {
        startPatternAuth();
      }, 2000);
      return;
    }

    if (tapTimingsRef.current.length > 8) {
      setStatus('❌ Too many taps (maximum 8)');
      setTimeout(() => {
        startPatternAuth();
      }, 2000);
      return;
    }

    const intervals = [];
    for (let i = 1; i < tapTimingsRef.current.length; i++) {
      intervals.push(tapTimingsRef.current[i].time - tapTimingsRef.current[i - 1].time);
    }

    const patternData = {
      taps: tapTimingsRef.current.length,
      intervals: intervals,
      avgInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      totalDuration: tapTimingsRef.current[tapTimingsRef.current.length - 1].time
    };

    if (mode === 'register') {
      try {
        if (window.storage && typeof window.storage.set === 'function') {
          window.storage.set('auth_pattern', JSON.stringify(patternData));
        }
        setPatterns(prev => ({ ...prev, pattern: patternData }));
        setStatus('✅ Tap pattern saved!');
        setTimeout(() => {
          setAuthMethod(null);
          setStatus('');
          setTapSequence([]);
        }, 2000);
      } catch (error) {
        setStatus('❌ Error saving pattern');
        console.error('Storage error:', error);
      }
    } else if (mode === 'login') {
      verifyPatternAuth(patternData);
    }
  };

  const verifyPatternAuth = (newPattern) => {
    if (!patterns.pattern) {
      setStatus('❌ No tap pattern registered');
      setTimeout(() => {
        startPatternAuth();
      }, 2000);
      return;
    }

    const p = patterns.pattern;

    if (newPattern.taps !== p.taps) {
      checkAuthSuccess('pattern', false);
      return;
    }

    let matchingIntervals = 0;
    for (let i = 0; i < newPattern.intervals.length; i++) {
      const diff = Math.abs(newPattern.intervals[i] - p.intervals[i]);
      const tolerance = p.intervals[i] * 0.4;
      if (diff <= tolerance) {
        matchingIntervals++;
      }
    }

    const intervalMatchRate = matchingIntervals / newPattern.intervals.length;
    const durationMatch = Math.abs(newPattern.totalDuration - p.totalDuration) / p.totalDuration < 0.3;

    checkAuthSuccess('pattern', intervalMatchRate >= 0.7 && durationMatch);
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
        setTapSequence([]);
      }, 3500);
    } else {
      setStatus('❌ Pattern incorrect. Ali Baba does not recognize you!');
      setTimeout(() => {
        startPatternAuth();
      }, 2500);
    }
  };

  return (
    <div className="auth-interface">
      <h2>🎵 {mode === 'register' ? 'Pattern Registration' : 'Pattern Login'}</h2>
      <div className="pattern-container">
        <div className="pattern-tap-area" onClick={handleTap}>
          {countdown !== null && (
            <div className="countdown-display">
              <Timer size={48} />
              <span className="countdown-number">{countdown}</span>
            </div>
          )}
          <div className="tap-visualization">
            {tapSequence.map((time, i) => (
              <div
                key={i}
                className="tap-indicator"
                style={{
                  left: `${(time / 5000) * 90 + 5}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <p className="tap-instruction">
            {countdown !== null
              ? 'Tap anywhere to create your rhythm'
              : 'Processing your pattern...'}
          </p>
        </div>
      </div>
      <p className="instruction">Create a unique tap rhythm (4-8 taps in 5 seconds)</p>
      {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default PatternAuth;
