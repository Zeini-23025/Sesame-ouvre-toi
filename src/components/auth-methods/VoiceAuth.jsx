import { Mic } from 'lucide-react';
import { useRef, useState } from 'react';

const VoiceAuth = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingDataRef = useRef([]);

  const startVoiceAuth = async () => {
    try {
      setStatus('🎤 Speak your magic phrase...');
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
      setStatus('❌ Microphone access denied');
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
      setStatus('❌ Recording too short');
      return;
    }

    const activeData = data.filter(d => d.volume > 0.01);

    if (activeData.length < 5) {
      setStatus('❌ No sound detected');
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
      try {
        // Check if storage is available
        if (window.storage && typeof window.storage.set === 'function') {
          window.storage.set('auth_voice', JSON.stringify(voicePattern));
        }
        setPatterns(prev => ({ ...prev, voice: voicePattern }));
        setStatus('✅ Voice pattern saved!');
        setTimeout(() => {
          setAuthMethod(null);
          setStatus('');
        }, 2000);
      } catch (error) {
        setStatus('❌ Error saving pattern');
        console.error('Storage error:', error);
      }
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
      setStatus('❌ No voice pattern registered');
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
      setStatus('❌ Pattern incorrect. Ali Baba does not recognize you!');
      setTimeout(() => {
        setStatus('');
      }, 2500);
    }
  };

  return (
    <div className="auth-interface">
      <h2>🎤 {mode === 'register' ? 'Voice Registration' : 'Voice Login'}</h2>
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
        {isRecording ? '🔴 Speaking now... your voice is being captured' : '⭕ Click to start recording'}
      </p>
      {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default VoiceAuth;
