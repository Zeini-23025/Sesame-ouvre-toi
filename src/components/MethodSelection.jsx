import { Mic, Palette, Shapes, Smile } from 'lucide-react';

const MethodSelection = ({ mode, setAuthMethod, setMode, patterns }) => {
  const handleMethodSelect = (method) => {
    setAuthMethod(method);
  };

  return (
    <div className="method-selection">
      <h2>{mode === 'register' ? 'Choose Your Registration Method' : 'Choose Your Login Method'}</h2>
      <p className="selection-description">
        {mode === 'register'
          ? 'Register your unique pattern to unlock the cave'
          : 'Use your registered pattern to open the mystical door'}
      </p>
      <div className="method-cards">
        {(mode === 'register' || patterns.voice) && (
          <div
            className="method-card voice-card"
            onClick={() => handleMethodSelect('voice')}
          >
            <div className="card-icon">
              <Mic size={56} />
            </div>
            <h3>Enchanted Voice</h3>
            <p>{mode === 'register' ? 'Speak your magic phrase with your unique timbre' : 'Use your unique voice'}</p>
            <div className="card-glow"></div>
          </div>
        )}

        {(mode === 'register' || patterns.emoji) && (
          <div
            className="method-card emoji-card"
            onClick={() => handleMethodSelect('emoji')}
          >
            <div className="card-icon">
              <Smile size={56} />
            </div>
            <h3>Emoji Path Lock</h3>
            <p>{mode === 'register' ? 'Create a path through emojis' : 'Follow your emoji path'}</p>
            <div className="card-glow"></div>
          </div>
        )}

        {(mode === 'register' || patterns.color) && (
          <div
            className="method-card color-card"
            onClick={() => handleMethodSelect('color')}
          >
            <div className="card-icon">
              <Palette size={56} />
            </div>
            <h3>Color Blender</h3>
            <p>{mode === 'register' ? 'Mix your unique color signature' : 'Recreate your color'}</p>
            <div className="card-glow"></div>
          </div>
        )}

        {(mode === 'register' || patterns.shape) && (
          <div
            className="method-card shape-card"
            onClick={() => handleMethodSelect('shape')}
          >
            <div className="card-icon">
              <Shapes size={56} />
            </div>
            <h3>Shape Builder</h3>
            <p>{mode === 'register' ? 'Build your geometric pattern' : 'Recreate your shape'}</p>
            <div className="card-glow"></div>
          </div>
        )}
      </div>
      <button onClick={() => setMode('welcome')} className="btn-back">
        ← Back to home
      </button>
    </div>
  );
};

export default MethodSelection;
