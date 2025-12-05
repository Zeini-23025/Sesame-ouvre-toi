import { useEffect, useState } from 'react';

const EmojiPathLock = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [gridEmojis, setGridEmojis] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [status, setStatus] = useState('');

  const emojiSets = {
    animals: ['🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🐵', '🦊', '🐺', '🐮', '🐷', '🐭', '🐹', '🐰', '🦝', '🦘', '🦒', '🦓'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧇', '🥐', '🥨', '🥯', '🍩', '🍪', '🎂', '🧁', '🍰', '🍫', '🍬', '🍭', '🍮'],
    space: ['🌟', '⭐', '🌙', '☀️', '🪐', '🌍', '🌎', '🌏', '🚀', '🛸', '🛰️', '☄️', '💫', '✨', '⚡', '🌈', '🔥', '❄️'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🏵️', '🌼', '🌲', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃', '🌿', '☘️', '🌾']
  };

  useEffect(() => {
    generateGrid();
  }, []);

  const generateGrid = () => {
    const allEmojis = [...emojiSets.animals, ...emojiSets.food, ...emojiSets.space, ...emojiSets.nature];
    const shuffled = [...allEmojis].sort(() => Math.random() - 0.5).slice(0, 36);
    setGridEmojis(shuffled);
    setSelectedPath([]);
    setStatus('');
  };

  const handleEmojiClick = (emoji, index) => {
    if (selectedPath.some(p => p.index === index)) {
      setStatus('⚠️ Already selected this emoji');
      return;
    }

    if (selectedPath.length >= 8) {
      setStatus('⚠️ Maximum 8 emojis');
      return;
    }

    setSelectedPath([...selectedPath, { emoji, index, position: selectedPath.length + 1 }]);
    setStatus('');
  };

  const removeLastEmoji = () => {
    setSelectedPath(selectedPath.slice(0, -1));
    setStatus('');
  };

  const clearPath = () => {
    setSelectedPath([]);
    setStatus('');
  };

  const handleSubmit = async () => {
    if (selectedPath.length < 4) {
      setStatus('❌ Select at least 4 emojis');
      return;
    }

    const pattern = selectedPath.map(p => p.emoji);

    if (mode === 'register') {
      try {
        // Check if storage is available
        if (window.storage && typeof window.storage.set === 'function') {
          await window.storage.set('auth_emoji', JSON.stringify(pattern));
        }
        setPatterns(prev => ({ ...prev, emoji: pattern }));
        setStatus('✅ Emoji path saved!');
        setTimeout(() => {
          setAuthMethod(null);
          setStatus('');
          setSelectedPath([]);
        }, 2000);
      } catch (error) {
        setStatus('❌ Error saving pattern');
        console.error('Storage error:', error);
      }
    } else if (mode === 'login') {
      verifyEmojiPattern(pattern);
    }
  };

  const verifyEmojiPattern = (newPattern) => {
    if (!patterns.emoji) {
      setStatus('❌ No emoji pattern registered');
      return;
    }

    const match = JSON.stringify(newPattern) === JSON.stringify(patterns.emoji);
    checkAuthSuccess('emoji', match);
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
        setSelectedPath([]);
      }, 3500);
    } else {
      setStatus('❌ Pattern incorrect. Ali Baba does not recognize you!');
      setTimeout(() => {
        setStatus('');
        setSelectedPath([]);
        generateGrid();
      }, 2500);
    }
  };

  return (
    <div className="auth-interface">
      <h2>😊 {mode === 'register' ? 'Emoji Path Registration' : 'Emoji Path Login'}</h2>

      <div className="emoji-path-display">
        {selectedPath.length === 0 ? (
          <p className="placeholder-text">Your emoji path will appear here...</p>
        ) : (
          <div className="emoji-sequence">
            {selectedPath.map((item, i) => (
              <div key={i} className="emoji-path-item">
                <span className="emoji-large">{item.emoji}</span>
                {i < selectedPath.length - 1 && (
                  <span className="emoji-arrow">→</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="emoji-grid">
        {gridEmojis.map((emoji, index) => {
          const isSelected = selectedPath.some(p => p.index === index);
          const position = selectedPath.find(p => p.index === index)?.position;

          return (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji, index)}
              className={`emoji-cell ${isSelected ? 'selected' : ''}`}
              disabled={isSelected}
            >
              {emoji}
              {isSelected && (
                <div className="emoji-position-badge">{position}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="button-row">
        <button onClick={removeLastEmoji} className="btn-action btn-remove" disabled={selectedPath.length === 0}>
          ← Remove Last
        </button>
        <button onClick={clearPath} className="btn-action btn-clear" disabled={selectedPath.length === 0}>
          🗑️ Clear All
        </button>
        <button onClick={generateGrid} className="btn-action btn-shuffle">
          🔄 Shuffle
        </button>
      </div>

      <button onClick={handleSubmit} className="btn-submit" disabled={selectedPath.length < 4}>
        {mode === 'register' ? '✨ Save Path' : '🔓 Unlock'}
      </button>

      <p className="instruction">
        {mode === 'register'
          ? 'Click 4-8 emojis in order to create your unique path'
          : 'Click the emojis in the correct order to unlock'}
      </p>

      {status && (
        <p className={`status ${status.includes('❌') || status.includes('⚠️') ? 'error' : 'success'}`}>
          {status}
        </p>
      )}

      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default EmojiPathLock;
