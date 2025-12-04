import { DoorOpen, Key, Keyboard, Mic, MousePointer, Sparkles, Unlock, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const VoiceAuth = () => {
  // États principaux
  const [mode, setMode] = useState('welcome'); // welcome, register, login, success
  const [authMethod, setAuthMethod] = useState(null); // voice, gesture, rhythm, draw
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Patterns sauvegardés
  const [patterns, setPatterns] = useState({
    voice: null,
    gesture: null,
    rhythm: null,
    draw: null
  });

  // Patterns temporaires (enregistrement en cours)
  const [currentPattern, setCurrentPattern] = useState(null);

  // Références pour l'audio
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingDataRef = useRef([]);

  // Références pour les gestures de souris
  const gestureDataRef = useRef([]);
  const gestureStartTimeRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Références pour le rythme de frappe
  const keyTimingsRef = useRef([]);
  const lastKeyTimeRef = useRef(null);
  const [keysPressed, setKeysPressed] = useState([]);

  // Charger les patterns au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('authPatterns');
    if (saved) {
      setPatterns(JSON.parse(saved));
    }
  }, []);

  // ==========================================
  // MÉTHODE 1 : AUTHENTIFICATION VOCALE
  // ==========================================
  const startVoiceAuth = async () => {
    try {
      setStatus('🎤 Prononcez votre phrase magique...');
      recordingDataRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      setIsRecording(true);
      analyzeAudio();

      setTimeout(() => {
        if (isRecording) stopVoiceAuth();
      }, 4000);

    } catch (err) {
      setStatus('❌ Accès au micro refusé');
      console.error(err);
    }
  };

  const analyzeAudio = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      analyserRef.current.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const volume = Math.sqrt(sum / bufferLength);

      recordingDataRef.current.push({
        time: Date.now(),
        volume: volume,
        peak: Math.max(...dataArray)
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const stopVoiceAuth = () => {
    setIsRecording(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    processVoicePattern();
  };

  const processVoicePattern = () => {
    const data = recordingDataRef.current;

    if (data.length < 10) {
      setStatus('❌ Enregistrement trop court');
      return;
    }

    const activeData = data.filter(d => d.volume > 0.01);

    if (activeData.length < 5) {
      setStatus('❌ Aucun son détecté');
      return;
    }

    const voicePattern = {
      duration: activeData.length,
      avgVolume: activeData.reduce((sum, d) => sum + d.volume, 0) / activeData.length,
      maxVolume: Math.max(...activeData.map(d => d.volume)),
      rhythm: calculateRhythm(activeData),
      peaks: countPeaks(activeData)
    };

    if (mode === 'register') {
      const newPatterns = { ...patterns, voice: voicePattern };
      setPatterns(newPatterns);
      localStorage.setItem('authPatterns', JSON.stringify(newPatterns));
      setStatus('✅ Voix enregistrée !');
      setTimeout(() => {
        setAuthMethod(null);
        setStatus('');
      }, 2000);
    } else if (mode === 'login') {
      verifyVoicePattern(voicePattern);
    }
  };

  const calculateRhythm = (data) => {
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(Math.abs(data[i].volume - data[i - 1].volume));
    }
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  };

  const countPeaks = (data) => {
    let peaks = 0;
    const threshold = 0.1;
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].volume > threshold &&
        data[i].volume > data[i - 1].volume &&
        data[i].volume > data[i + 1].volume) {
        peaks++;
      }
    }
    return peaks;
  };

  const verifyVoicePattern = (newPattern) => {
    if (!patterns.voice) {
      setStatus('❌ Aucune voix enregistrée');
      return;
    }

    const p = patterns.voice;
    const durationMatch = Math.abs(newPattern.duration - p.duration) / p.duration < 0.3;
    const volumeMatch = Math.abs(newPattern.avgVolume - p.avgVolume) / p.avgVolume < 0.3;
    const rhythmMatch = Math.abs(newPattern.rhythm - p.rhythm) / p.rhythm < 0.4;
    const peaksMatch = Math.abs(newPattern.peaks - p.peaks) <= 2;

    const score = [durationMatch, volumeMatch, rhythmMatch, peaksMatch].filter(Boolean).length;

    checkAuthSuccess('voice', score >= 3);
  };

  // ==========================================
  // MÉTHODE 2 : GESTURE DE SOURIS
  // ==========================================
  const startGestureAuth = () => {
    setStatus('🖱️ Dessinez votre geste secret (maintenez le clic)');
    gestureDataRef.current = [];
    gestureStartTimeRef.current = null;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleMouseDown = (e) => {
    if (authMethod !== 'gesture') return;
    isDrawingRef.current = true;
    gestureStartTimeRef.current = Date.now();
    gestureDataRef.current = [];

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gestureDataRef.current.push({ x, y, time: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || authMethod !== 'gesture') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = Date.now() - gestureStartTimeRef.current;

    gestureDataRef.current.push({ x, y, time });

    // Dessiner
    const ctx = canvasRef.current.getContext('2d');
    const prevPoint = gestureDataRef.current[gestureDataRef.current.length - 2];

    ctx.strokeStyle = 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcf7f)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current || authMethod !== 'gesture') return;
    isDrawingRef.current = false;

    processGesturePattern();
  };

  const processGesturePattern = () => {
    if (gestureDataRef.current.length < 10) {
      setStatus('❌ Geste trop court');
      return;
    }

    const gesturePattern = {
      points: gestureDataRef.current.length,
      duration: gestureDataRef.current[gestureDataRef.current.length - 1].time,
      totalDistance: calculateTotalDistance(gestureDataRef.current),
      avgSpeed: calculateAvgSpeed(gestureDataRef.current),
      directions: analyzeDirections(gestureDataRef.current)
    };

    if (mode === 'register') {
      const newPatterns = { ...patterns, gesture: gesturePattern };
      setPatterns(newPatterns);
      localStorage.setItem('authPatterns', JSON.stringify(newPatterns));
      setStatus('✅ Geste enregistré !');
      setTimeout(() => {
        setAuthMethod(null);
        setStatus('');
      }, 2000);
    } else if (mode === 'login') {
      verifyGesturePattern(gesturePattern);
    }
  };

  const calculateTotalDistance = (points) => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  };

  const calculateAvgSpeed = (points) => {
    if (points.length < 2) return 0;
    const distance = calculateTotalDistance(points);
    const time = points[points.length - 1].time / 1000;
    return distance / time;
  };

  const analyzeDirections = (points) => {
    let up = 0, down = 0, left = 0, right = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) right++; else left++;
      } else {
        if (dy > 0) down++; else up++;
      }
    }
    return { up, down, left, right };
  };

  const verifyGesturePattern = (newPattern) => {
    if (!patterns.gesture) {
      setStatus('❌ Aucun geste enregistré');
      return;
    }

    const p = patterns.gesture;
    const pointsMatch = Math.abs(newPattern.points - p.points) / p.points < 0.4;
    const durationMatch = Math.abs(newPattern.duration - p.duration) / p.duration < 0.4;
    const distanceMatch = Math.abs(newPattern.totalDistance - p.totalDistance) / p.totalDistance < 0.4;
    const speedMatch = Math.abs(newPattern.avgSpeed - p.avgSpeed) / p.avgSpeed < 0.5;

    const score = [pointsMatch, durationMatch, distanceMatch, speedMatch].filter(Boolean).length;

    checkAuthSuccess('gesture', score >= 3);
  };

  // ==========================================
  // MÉTHODE 3 : RYTHME DE FRAPPE
  // ==========================================
  const startRhythmAuth = () => {
    setStatus('⌨️ Tapez votre phrase secrète (min 8 caractères)');
    keyTimingsRef.current = [];
    lastKeyTimeRef.current = null;
    setKeysPressed([]);
  };

  const handleKeyDown = (e) => {
    if (authMethod !== 'rhythm') return;

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

  const processRhythmPattern = () => {
    if (keyTimingsRef.current.length < 8) {
      setStatus('❌ Phrase trop courte (min 8 caractères)');
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
      const newPatterns = { ...patterns, rhythm: rhythmPattern };
      setPatterns(newPatterns);
      localStorage.setItem('authPatterns', JSON.stringify(newPatterns));
      setStatus('✅ Rythme enregistré !');
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
      setStatus('❌ Aucun rythme enregistré');
      return;
    }

    const p = patterns.rhythm;
    const sequenceMatch = newPattern.sequence === p.sequence;
    const intervalMatch = Math.abs(newPattern.avgInterval - p.avgInterval) / p.avgInterval < 0.3;
    const varianceMatch = Math.abs(newPattern.variance - p.variance) / p.variance < 0.4;

    const score = [sequenceMatch, intervalMatch, varianceMatch].filter(Boolean).length;

    checkAuthSuccess('rhythm', score >= 2 && sequenceMatch);
  };

  // ==========================================
  // VÉRIFICATION FINALE
  // ==========================================
  const checkAuthSuccess = (method, success) => {
    if (success) {
      setStatus('✨ SÉSAME OUVRE-TOI ! ✨');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setMode('welcome');
        setStatus('');
        setAuthMethod(null);
      }, 3500);
    } else {
      setStatus('❌ Pattern incorrect. Ali ne te reconnaît pas !');
      setTimeout(() => {
        setStatus('');
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setKeysPressed([]);
      }, 2500);
    }
  };

  // ==========================================
  // RÉINITIALISATION
  // ==========================================
  const resetPatterns = () => {
    localStorage.removeItem('authPatterns');
    setPatterns({ voice: null, gesture: null, rhythm: null, draw: null });
    setStatus('🗑️ Tous les patterns supprimés');
    setTimeout(() => setStatus(''), 2000);
  };

  const hasAnyPattern = Object.values(patterns).some(p => p !== null);

  // ==========================================
  // RENDU
  // ==========================================
  return (
    <div className="container" onKeyDown={handleKeyDown}>
      {/* Animation de succès */}
      {showSuccess && (
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
          <h1 className="success-text">🎉 BIENVENUE DANS LA CAVERNE ! 🎉</h1>
          <p className="success-subtitle">Les 40 voleurs tremblent devant toi...</p>
        </div>
      )}

      {/* En-tête */}
      <header className="header">
        <div className="logo">
          <Key size={48} className="key-icon" />
          <div className="logo-text">
            <h1>Sésame Multi-Modal</h1>
            <div className="logo-subtitle">L'authentification des Mille et Une Nuits</div>
          </div>
        </div>
        <div className="methods-indicator">
          {patterns.voice && <span className="badge voice-badge">🎤 Voix</span>}
          {patterns.gesture && <span className="badge gesture-badge">🖱️ Geste</span>}
          {patterns.rhythm && <span className="badge rhythm-badge">⌨️ Rythme</span>}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="main-content">
        {mode === 'welcome' && (
          <div className="welcome-screen">
            <div className="lamp-container">
              <div className="lamp">🧞‍♂️</div>
              <div className="lamp-glow"></div>
            </div>
            <h2>Choisis Ton Destin, Voyageur</h2>
            <p className="welcome-description">
              Sélectionne ta méthode d'authentification mystique pour déverrouiller les secrets de la caverne
            </p>

            <div className="button-group">
              <button
                onClick={() => setMode('register')}
                className="btn btn-primary"
                disabled={hasAnyPattern}
              >
                <Wand2 size={24} />
                <span>Créer Mes Sésames Magiques</span>
                <div className="btn-sparkle"></div>
              </button>
              <button
                onClick={() => setMode('login')}
                className="btn btn-secondary"
                disabled={!hasAnyPattern}
              >
                <Unlock size={24} />
                <span>Ouvrir la Caverne</span>
                <div className="btn-sparkle"></div>
              </button>
            </div>

            {hasAnyPattern && (
              <button onClick={resetPatterns} className="btn-reset">
                <span className="reset-icon">🗑️</span>
                Réinitialiser tous les patterns
              </button>
            )}

            <div className="info-box">
              <h3>🌟 Méthodes Mystiques Disponibles</h3>
              <div className="method-list">
                <div className="method-item voice-method">
                  <div className="method-icon">
                    <Mic size={28} />
                  </div>
                  <div className="method-content">
                    <strong>Voix Enchantée</strong>
                    <p>Ta voix est unique comme un sortilège ancien</p>
                  </div>
                </div>
                <div className="method-item gesture-method">
                  <div className="method-icon">
                    <MousePointer size={28} />
                  </div>
                  <div className="method-content">
                    <strong>Geste Mystique</strong>
                    <p>Dessine ta signature magique dans l'air</p>
                  </div>
                </div>
                <div className="method-item rhythm-method">
                  <div className="method-icon">
                    <Keyboard size={28} />
                  </div>
                  <div className="method-content">
                    <strong>Rythme Personnel</strong>
                    <p>Le tempo de ta frappe est ta clé secrète</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'register' && !authMethod && (
          <div className="method-selection">
            <h2>📝 Choisis Ta Méthode d'Enregistrement</h2>
            <p className="selection-description">
              Enregistre ton pattern unique pour déverrouiller la caverne
            </p>
            <div className="method-cards">
              <div
                className="method-card voice-card"
                onClick={() => { setAuthMethod('voice'); startVoiceAuth(); }}
              >
                <div className="card-icon">
                  <Mic size={56} />
                </div>
                <h3>Voix Enchantée</h3>
                <p>Prononce ta phrase magique avec ton timbre unique</p>
                <div className="card-glow"></div>
              </div>
              <div
                className="method-card gesture-card"
                onClick={() => { setAuthMethod('gesture'); startGestureAuth(); }}
              >
                <div className="card-icon">
                  <MousePointer size={56} />
                </div>
                <h3>Geste Mystique</h3>
                <p>Dessine ton symbole secret dans le ciel numérique</p>
                <div className="card-glow"></div>
              </div>
              <div
                className="method-card rhythm-card"
                onClick={() => { setAuthMethod('rhythm'); startRhythmAuth(); }}
              >
                <div className="card-icon">
                  <Keyboard size={56} />
                </div>
                <h3>Rythme Secret</h3>
                <p>Tape ta phrase avec ton tempo personnel unique</p>
                <div className="card-glow"></div>
              </div>
            </div>
            <button onClick={() => setMode('welcome')} className="btn-back">
              ← Retour à l'accueil
            </button>
          </div>
        )}

        {mode === 'login' && !authMethod && (
          <div className="method-selection">
            <h2>🔐 Choisis Ta Méthode de Connexion</h2>
            <p className="selection-description">
              Utilise ton pattern enregistré pour ouvrir la porte mystique
            </p>
            <div className="method-cards">
              {patterns.voice && (
                <div
                  className="method-card voice-card"
                  onClick={() => { setAuthMethod('voice'); startVoiceAuth(); }}
                >
                  <div className="card-icon">
                    <Mic size={56} />
                  </div>
                  <h3>Voix Enchantée</h3>
                  <p>Utilise ta voix unique</p>
                </div>
              )}
              {patterns.gesture && (
                <div
                  className="method-card gesture-card"
                  onClick={() => { setAuthMethod('gesture'); startGestureAuth(); }}
                >
                  <div className="card-icon">
                    <MousePointer size={56} />
                  </div>
                  <h3>Geste Mystique</h3>
                  <p>Reproduis ton geste secret</p>
                </div>
              )}
              {patterns.rhythm && (
                <div
                  className="method-card rhythm-card"
                  onClick={() => { setAuthMethod('rhythm'); startRhythmAuth(); }}
                >
                  <div className="card-icon">
                    <Keyboard size={56} />
                  </div>
                  <h3>Rythme Secret</h3>
                  <p>Tape avec ton tempo unique</p>
                </div>
              )}
            </div>
            <button onClick={() => setMode('welcome')} className="btn-back">
              ← Retour à l'accueil
            </button>
          </div>
        )}

        {authMethod === 'voice' && (
          <div className="auth-interface">
            <h2>🎤 {mode === 'register' ? 'Enregistrement' : 'Connexion'} Vocale</h2>
            <div className="mic-container">
              <button
                onClick={isRecording ? stopVoiceAuth : startVoiceAuth}
                className={`mic-button ${isRecording ? 'recording' : ''}`}
              >
                <Mic size={72} />
                <div className="mic-glow"></div>
              </button>
              {isRecording && (
                <>
                  <div className="pulse-ring ring-1"></div>
                  <div className="pulse-ring ring-2"></div>
                  <div className="pulse-ring ring-3"></div>
                </>
              )}
            </div>
            <p className="instruction">
              {isRecording ? '🔴 Parlez maintenant... votre voix est capturée' : '⭕ Cliquez pour commencer l\'enregistrement'}
            </p>
            {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
            <button onClick={() => setAuthMethod(null)} className="btn-back">
              ← Changer de méthode
            </button>
          </div>
        )}

        {authMethod === 'gesture' && (
          <div className="auth-interface">
            <h2>🖱️ {mode === 'register' ? 'Enregistrement' : 'Connexion'} par Geste</h2>
            <div className="gesture-container">
              <canvas
                ref={canvasRef}
                width={500}
                height={350}
                className="gesture-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
              <div className="canvas-border"></div>
            </div>
            <p className="instruction">Maintenez le clic et dessinez votre symbole mystique</p>
            {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
            <button onClick={() => setAuthMethod(null)} className="btn-back">
              ← Changer de méthode
            </button>
          </div>
        )}

        {authMethod === 'rhythm' && (
          <div className="auth-interface">
            <h2>⌨️ {mode === 'register' ? 'Enregistrement' : 'Connexion'} par Rythme</h2>
            <div className="keyboard-display">
              <Keyboard size={96} className="keyboard-icon" />
              <div className="keys-display">
                {keysPressed.map((key, i) => (
                  <span key={i} className="key-pressed" style={{
                    animationDelay: `${i * 0.05}s`
                  }}>{key}</span>
                ))}
                {keysPressed.length === 0 && (
                  <span className="placeholder-text">Commencez à taper...</span>
                )}
              </div>
            </div>
            <p className="instruction">Tapez votre phrase secrète (minimum 8 caractères)</p>
            {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
            <button onClick={() => setAuthMethod(null)} className="btn-back">
              ← Changer de méthode
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>🌙 Multi-Modal Biometric Authentication • React + Web APIs 🌙</p>
        <p className="footer-sub">Entrez dans la légende des 1001 nuits</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
         font-family: 'Poppins', sans-serif;

          background: linear-gradient(135deg, #0a0a2a 0%, #1a1a3a 30%, #2a2a4a 100%);
          color: #f8f8ff;
          min-height: 100vh;
          overflow-x: hidden;
          // background-image:
          //   radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          //   radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
          //   radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.15) 0%, transparent 50%);
        }

        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBoxncez à taper...='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
        }

        .header {
          text-align: center;
          padding: 2.5rem 2rem 2rem;
          background: linear-gradient(180deg, rgba(26, 26, 58, 0.95) 0%, rgba(10, 10, 42, 0.8) 100%);
          border-bottom: 2px solid transparent;
          border-image: linear-gradient(90deg, transparent, #ff6b6b, #ffd93d, #6bcf7f, transparent) 1;
          position: relative;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcf7f);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .key-icon {
          color: #ffd93d;
          animation: float 6s ease-in-out infinite;
          filter: drop-shadow(0 0 15px rgba(255, 217, 61, 0.7));
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        .logo-text {
          text-align: left;
        }

        h1 {
          font-family: 'Cinzel', serif;
          font-size: 3rem;
          background: linear-gradient(135deg, #ffd93d 0%, #ff6b6b 50%, #6bcf7f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          letter-spacing: 1px;
          margin-bottom: 0.2rem;
        }

        .logo-subtitle {
          font-size: 1.1rem;
          color: #b8b8ff;
          font-style: italic;
          letter-spacing: 1px;
        }

        .methods-indicator {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }

        .badge {
          padding: 0.5rem 1.2rem;
          border-radius: 25px;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          border: 2px solid transparent;
          background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)) padding-box,
                    linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcf7f) border-box;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease;
        }

        .badge:hover {
          transform: translateY(-2px);
        }

        .voice-badge { color: #ff6b6b; }
        .gesture-badge { color: #ffd93d; }
        .rhythm-badge { color: #6bcf7f; }

        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
        }

        .welcome-screen, .method-selection, .auth-interface {
          background: linear-gradient(145deg, rgba(42, 42, 74, 0.9), rgba(26, 26, 58, 0.9));
          backdrop-filter: blur(20px);
          border: 2px solid transparent;
          border-radius: 30px;
          padding: 4rem 3rem;
          max-width: 800px;
          width: 100%;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .welcome-screen::before, .method-selection::before, .auth-interface::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;

          border-radius: 32px;
          z-index: -1;
          opacity: 0.3;
          animation: borderRotate 4s linear infinite;
        }

        @keyframes borderRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .lamp-container {
          display: flex;
          justify-content: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .lamp {
          font-size: 6rem;
          filter: drop-shadow(0 0 30px rgba(255, 217, 61, 0.8));
          animation:
            floatLamp 4s ease-in-out infinite,
            glowLamp 2s ease-in-out infinite;
          z-index: 2;
        }

        @keyframes floatLamp {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }

        @keyframes glowLamp {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .lamp-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255, 217, 61, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulseGlow 3s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        h2 {
          font-family: 'Cinzel', serif;
          text-align: center;
          background: linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          font-size: 2.5rem;
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .welcome-description, .selection-description {
          text-align: center;
          color: #b8b8ff;
          font-size: 1.1rem;
          margin-bottom: 3rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 3rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.5rem 3rem;
          font-size: 1.2rem;
          font-family: 'Cinzel', serif;
          font-weight: 600;
          border: none;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.4s ease;
          overflow: hidden;
          z-index: 1;
          letter-spacing: 1px;
        }

        .btn span {
          position: relative;
          z-index: 2;
        }

        .btn svg {
          position: relative;
          z-index: 2;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .btn:hover::before {
          opacity: 1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
          color: #1a1a3a;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255, 107, 107, 0.6);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #4d96ff 0%, #6bcf7f 100%);
          color: #1a1a3a;
          box-shadow: 0 10px 30px rgba(109, 207, 127, 0.4);
        }

        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(109, 207, 127, 0.6);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
        }

        .btn-sparkle {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn:hover .btn-sparkle {
          opacity: 1;
          animation: sparkle 1.5s ease-in-out;
        }

        @keyframes sparkle {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .btn-reset {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin: 2rem auto;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1));
          border: 2px solid rgba(255, 107, 107, 0.4);
          color: #ff6b6b;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Raleway', sans-serif;
          font-weight: 600;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
        }

        .btn-reset:hover {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 107, 107, 0.2));
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }

        .reset-icon {
          font-size: 1.2rem;
          animation: shake 0.5s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        .info-box {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 2px solid rgba(255, 217, 61, 0.3);
          border-radius: 20px;
          padding: 2.5rem;
          margin-top: 3rem;
          backdrop-filter: blur(10px);
        }

        .info-box h3 {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #ffd93d, #b8b8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .method-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .method-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border-radius: 15px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .method-item:hover {
          transform: translateX(10px);
          border-color: rgba(255, 217, 61, 0.5);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .voice-method:hover { border-color: rgba(255, 107, 107, 0.5); }
        .gesture-method:hover { border-color: rgba(255, 217, 61, 0.5); }
        .rhythm-method:hover { border-color: rgba(109, 207, 127, 0.5); }

        .method-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 217, 61, 0.2));
          flex-shrink: 0;
        }

        .gesture-method .method-icon {
          background: linear-gradient(135deg, rgba(255, 217, 61, 0.2), rgba(109, 207, 127, 0.2));
        }

        .rhythm-method .method-icon {
          background: linear-gradient(135deg, rgba(109, 207, 127, 0.2), rgba(77, 150, 255, 0.2));
        }

        .method-icon svg {
          color: #ffd93d;
          width: 28px;
          height: 28px;
        }

        .method-content {
          flex: 1;
        }

        .method-content strong {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          color: #ffd93d;
          display: block;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .voice-method strong { color: #ff6b6b; }
        .gesture-method strong { color: #ffd93d; }
        .rhythm-method strong { color: #6bcf7f; }

        .method-content p {
          color: #b8b8ff;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .method-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin: 3rem 0;
        }

        .method-card {
          position: relative;
          background: linear-gradient(145deg, rgba(42, 42, 74, 0.8), rgba(26, 26, 58, 0.8));
          border: 2px solid transparent;
          border-radius: 20px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.4s ease;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .voice-card { border-color: rgba(255, 107, 107, 0.3); }
        .gesture-card { border-color: rgba(255, 217, 61, 0.3); }
        .rhythm-card { border-color: rgba(109, 207, 127, 0.3); }

        .method-card:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .voice-card:hover { box-shadow: 0 20px 50px rgba(255, 107, 107, 0.3); }
        .gesture-card:hover { box-shadow: 0 20px 50px rgba(255, 217, 61, 0.3); }
        .rhythm-card:hover { box-shadow: 0 20px 50px rgba(109, 207, 127, 0.3); }

        .card-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 217, 61, 0.2));
          position: relative;
        }

        .gesture-card .card-icon {
          background: linear-gradient(135deg, rgba(255, 217, 61, 0.2), rgba(109, 207, 127, 0.2));
        }

        .rhythm-card .card-icon {
          background: linear-gradient(135deg, rgba(109, 207, 127, 0.2), rgba(77, 150, 255, 0.2));
        }

        .card-icon svg {
          color: #ffd93d;
          width: 56px;
          height: 56px;
        }

        .method-card h3 {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #ffd93d;
          letter-spacing: 0.5px;
        }

        .voice-card h3 { color: #ff6b6b; }
        .gesture-card h3 { color: #ffd93d; }
        .rhythm-card h3 { color: #6bcf7f; }

        .method-card p {
          color: #b8b8ff;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 0;
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(255, 217, 61, 0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .method-card:hover .card-glow {
          opacity: 1;
        }

        .auth-interface {
          max-width: 700px;
        }

        .mic-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 3rem 0;
        }

        .mic-button {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4d96ff 0%, #6bcf7f 100%);
          border: 5px solid rgba(255, 255, 255, 0.2);
          color: #1a1a3a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          box-shadow:
            0 15px 35px rgba(109, 207, 127, 0.4),
            inset 0 5px 15px rgba(255, 255, 255, 0.2);
        }

        .mic-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 40px rgba(109, 207, 127, 0.6);
        }

        .mic-button.recording {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
          animation: pulse 1.2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .mic-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 3px solid #ff6b6b;
          opacity: 0;
        }

        .ring-1 {
          width: 180px;
          height: 180px;
          animation: ringPulse 1.5s ease-out infinite;
        }

        .ring-2 {
          width: 240px;
          height: 240px;
          animation: ringPulse 1.5s ease-out 0.5s infinite;
        }

        .ring-3 {
          width: 300px;
          height: 300px;
          animation: ringPulse 1.5s ease-out 1s infinite;
        }

        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .gesture-container {
          position: relative;
          margin: 2rem auto;
          width: 500px;
          height: 350px;
        }

        .gesture-canvas {
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-radius: 20px;
          background: rgba(10, 10, 42, 0.8);
          cursor: crosshair;
          position: relative;
          z-index: 2;
        }

        .canvas-border {
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4d96ff);
          border-radius: 25px;
          z-index: 1;
          opacity: 0.5;
          animation: borderRotate 4s linear infinite;
        }

        .keyboard-display {
          text-align: center;
          margin: 3rem 0;
        }

        .keyboard-icon {
          color: #6bcf7f;
          margin-bottom: 2rem;
          filter: drop-shadow(0 0 20px rgba(109, 207, 127, 0.6));
          animation: float 3s ease-in-out infinite;
        }

        .keys-display {
          min-height: 80px;
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          justify-content: center;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(10, 10, 42, 0.8), rgba(26, 26, 58, 0.8));
          border-radius: 15px;
          border: 2px solid rgba(109, 207, 127, 0.3);
          backdrop-filter: blur(10px);
        }

        .key-pressed {
          background: linear-gradient(135deg, #6bcf7f, #4d96ff);
          color: #1a1a3a;
          padding: 0.8rem 1.2rem;
          border-radius: 10px;
          font-weight: bold;
          font-size: 1.2rem;
          animation: keyPop 0.3s ease forwards;
          box-shadow: 0 5px 15px rgba(109, 207, 127, 0.4);
          transform-origin: center;
        }

        @keyframes keyPop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .placeholder-text {
          color: rgba(184, 184, 255, 0.5);
          font-style: italic;
          font-size: 1.1rem;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .instruction {
          text-align: center;
          font-size: 1.2rem;
          color: #b8b8ff;
          margin: 2rem 0;
          font-weight: 500;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .status {
          text-align: center;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 2rem 0;
          padding: 1.5rem;
          border-radius: 15px;
          animation: slideIn 0.5s ease-out;
          letter-spacing: 0.5px;
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .status.success {
          background: linear-gradient(135deg, rgba(109, 207, 127, 0.2), rgba(77, 150, 255, 0.2));
          border: 2px solid rgba(109, 207, 127, 0.5);
          color: #6bcf7f;
          box-shadow: 0 10px 30px rgba(109, 207, 127, 0.3);
        }

        .status.error {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 217, 61, 0.2));
          border: 2px solid rgba(255, 107, 107, 0.5);
          color: #ff6b6b;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
        }

        .btn-back {
          display: block;
          margin: 3rem auto 0;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 2px solid rgba(184, 184, 255, 0.3);
          color: #b8b8ff;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Raleway', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
        }

        .btn-back:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1));
          transform: translateX(-5px);
          border-color: rgba(255, 217, 61, 0.5);
          color: #ffd93d;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(26, 26, 58, 0.95) 0%, rgba(10, 10, 42, 0.98) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.6s ease-out;
        }

        .door-animation {
          position: relative;
          margin-bottom: 4rem;
        }

        .door-icon {
          color: #ffd93d;
          animation: doorReveal 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 0 40px rgba(255, 217, 61, 0.9));
        }

        @keyframes doorReveal {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.4) rotate(15deg); opacity: 1; }
          80% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .particles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          animation: particleFloat 2.5s ease-out infinite;
          filter: drop-shadow(0 0 8px currentColor);
        }

        @keyframes particleFloat {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--tx, 0), var(--ty, -150px)) scale(2) rotate(720deg); opacity: 0; }
        }

        .success-text {
          font-family: 'Cinzel', serif;
          font-size: 4rem;
          background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcf7f, #4d96ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          animation:
            textReveal 1.2s ease-out,
            textGlow 2s ease-in-out infinite;
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          margin-bottom: 1.5rem;
          letter-spacing: 2px;
        }

        @keyframes textReveal {
          0% { letter-spacing: -10px; opacity: 0; }
          100% { letter-spacing: 2px; opacity: 1; }
        }

        @keyframes textGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 217, 61, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(255, 217, 61, 0.8)); }
        }

        .success-subtitle {
          font-size: 1.8rem;
          color: #b8b8ff;
          text-align: center;
          font-style: italic;
          animation: fadeInUp 1s 0.5s both;
          letter-spacing: 1px;
        }

        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .footer {
          text-align: center;
          padding: 2rem;
          background: linear-gradient(180deg, rgba(10, 10, 42, 0.9), rgba(26, 26, 58, 0.8));
          border-top: 2px solid rgba(255, 217, 61, 0.3);
          color: #b8b8ff;
          font-size: 1rem;
          letter-spacing: 1px;
        }

        .footer-sub {
          color: rgba(184, 184, 255, 0.6);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          h1 { font-size: 2.2rem; }
          h2 { font-size: 1.8rem; }
          .success-text { font-size: 2.5rem; }

          .welcome-screen, .method-selection, .auth-interface {
            padding: 2.5rem 1.5rem;
          }

          .method-cards {
            grid-template-columns: 1fr;
          }

          .gesture-container {
            width: 100%;
            max-width: 400px;
            height: 300px;
          }

          .mic-button {
            width: 150px;
            height: 150px;
          }

          .button-group {
            max-width: 100%;
          }

          .logo {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .logo-text {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          h1 { font-size: 1.8rem; }
          h2 { font-size: 1.5rem; }

          .header {
            padding: 1.5rem 1rem;
          }

          .main-content {
            padding: 1.5rem 1rem;
          }

          .btn {
            padding: 1.2rem 2rem;
            font-size: 1rem;
          }

          .method-card {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceAuth;
