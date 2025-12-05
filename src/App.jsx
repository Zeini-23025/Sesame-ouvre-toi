import { useEffect, useState } from 'react';
import ColorBlenderAuth from './components/auth-methods/ColorBlenderAuth';
import EmojiPathLock from './components/auth-methods/EmojiPathLock';
import ShapeBuilderAuth from './components/auth-methods/ShapeBuilderAuth';
import VoiceAuth from './components/auth-methods/VoiceAuth';
import Footer from './components/Footer';
import Header from './components/Header';
import MethodSelection from './components/MethodSelection';
import SuccessOverlay from './components/SuccessOverlay';
import WelcomeScreen from './components/WelcomeScreen';

import './styles/App.css';
import './styles/ColorBlenderAuth.css';
import './styles/EmojiPathLock.css';
import './styles/Footer.css';
import './styles/Header.css';
import './styles/MethodSelection.css';
import './styles/ShapeBuilderAuth.css';
import './styles/SuccessOverlay.css';
import './styles/VoiceAuth.css';
import './styles/WelcomeScreen.css';

const App = () => {
  const [mode, setMode] = useState('welcome'); // welcome, register, login, success
  const [authMethod, setAuthMethod] = useState(null); // voice, emoji, color, shape
  const [showSuccess, setShowSuccess] = useState(false);
  const [patterns, setPatterns] = useState({
    voice: null,
    emoji: null,
    color: null,
    shape: null
  });

  // Load patterns on mount
  useEffect(() => {
    const loadPatterns = async () => {
      try {
        // Check if storage API is available
        if (!window.storage || typeof window.storage.get !== 'function') {
          console.log('Storage API not available');
          return;
        }

        const voiceData = await window.storage.get('auth_voice');
        const emojiData = await window.storage.get('auth_emoji');
        const colorData = await window.storage.get('auth_color');
        const shapeData = await window.storage.get('auth_shape');

        setPatterns({
          voice: voiceData ? JSON.parse(voiceData.value) : null,
          emoji: emojiData ? JSON.parse(emojiData.value) : null,
          color: colorData ? JSON.parse(colorData.value) : null,
          shape: shapeData ? JSON.parse(shapeData.value) : null
        });
      } catch (error) {
        console.log('No saved patterns found or storage error:', error);
      }
    };

    loadPatterns();
  }, []);

  // Reset patterns function
  const resetPatterns = async () => {
    try {
      // Check if storage API is available
      if (window.storage && typeof window.storage.delete === 'function') {
        await window.storage.delete('auth_voice');
        await window.storage.delete('auth_emoji');
        await window.storage.delete('auth_color');
        await window.storage.delete('auth_shape');
      }
    } catch (error) {
      console.log('Error deleting patterns:', error);
    }

    setPatterns({ voice: null, emoji: null, color: null, shape: null });
  };

  const hasAnyPattern = Object.values(patterns).some(p => p !== null);

  return (
    <div className="container">
      {showSuccess && <SuccessOverlay />}

      <Header patterns={patterns} />

      <main className="main-content">
        {mode === 'welcome' && (
          <WelcomeScreen
            setMode={setMode}
            hasAnyPattern={hasAnyPattern}
            resetPatterns={resetPatterns}
          />
        )}

        {mode === 'register' && !authMethod && (
          <MethodSelection
            mode="register"
            setAuthMethod={setAuthMethod}
            setMode={setMode}
            patterns={patterns}
          />
        )}

        {mode === 'login' && !authMethod && (
          <MethodSelection
            mode="login"
            setAuthMethod={setAuthMethod}
            setMode={setMode}
            patterns={patterns}
          />
        )}

        {authMethod === 'voice' && (
          <VoiceAuth
            mode={mode}
            patterns={patterns}
            setPatterns={setPatterns}
            setAuthMethod={setAuthMethod}
            setShowSuccess={setShowSuccess}
            setMode={setMode}
          />
        )}

        {authMethod === 'emoji' && (
          <EmojiPathLock
            mode={mode}
            patterns={patterns}
            setPatterns={setPatterns}
            setAuthMethod={setAuthMethod}
            setShowSuccess={setShowSuccess}
            setMode={setMode}
          />
        )}

        {authMethod === 'color' && (
          <ColorBlenderAuth
            mode={mode}
            patterns={patterns}
            setPatterns={setPatterns}
            setAuthMethod={setAuthMethod}
            setShowSuccess={setShowSuccess}
            setMode={setMode}
          />
        )}

        {authMethod === 'shape' && (
          <ShapeBuilderAuth
            mode={mode}
            patterns={patterns}
            setPatterns={setPatterns}
            setAuthMethod={setAuthMethod}
            setShowSuccess={setShowSuccess}
            setMode={setMode}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
