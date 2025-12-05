import { Mic, Palette, Shapes, Smile, Unlock, Wand2 } from 'lucide-react';

const WelcomeScreen = ({ setMode, hasAnyPattern, resetPatterns }) => {
  return (
    <div className="welcome-screen">
      <div className="lamp-container">
        <div className="lamp">🧞‍♂️</div>
        <div className="lamp-glow"></div>
      </div>
      <h2>Choose Your Destiny, Traveler</h2>
      <p className="welcome-description">
        Select your mystical authentication method to unlock the secrets of the cave
      </p>

      <div className="button-group">
        <button
          onClick={() => setMode('register')}
          className="btn btn-primary"
          disabled={hasAnyPattern}
        >
          <Wand2 size={24} />
          <span>Create My Magic Keys</span>
          <div className="btn-sparkle"></div>
        </button>
        <button
          onClick={() => setMode('login')}
          className="btn btn-secondary"
          disabled={!hasAnyPattern}
        >
          <Unlock size={24} />
          <span>Open the Cave</span>
          <div className="btn-sparkle"></div>
        </button>
      </div>

      {hasAnyPattern && (
        <button onClick={resetPatterns} className="btn-reset">
          <span className="reset-icon">🗑️</span>
          Reset all patterns
        </button>
      )}

      <div className="info-box">
        <h3>🌟 Available Mystical Methods</h3>
        <div className="method-list">
          <div className="method-item voice-method">
            <div className="method-icon">
              <Mic size={28} />
            </div>
            <div className="method-content">
              <strong>Enchanted Voice</strong>
              <p>Your voice is unique like an ancient spell</p>
            </div>
          </div>
          <div className="method-item emoji-method">
            <div className="method-icon">
              <Smile size={28} />
            </div>
            <div className="method-content">
              <strong>Emoji Path Lock</strong>
              <p>Draw your unique path through mystical symbols</p>
            </div>
          </div>
          <div className="method-item color-method">
            <div className="method-icon">
              <Palette size={28} />
            </div>
            <div className="method-content">
              <strong>Color Blender</strong>
              <p>Mix RGB sliders to create your unique shade</p>
            </div>
          </div>
          <div className="method-item shape-method">
            <div className="method-icon">
              <Shapes size={28} />
            </div>
            <div className="method-content">
              <strong>Shape Builder</strong>
              <p>Assemble geometric blocks into your signature pattern</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
