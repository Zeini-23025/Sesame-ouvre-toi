import { Key } from 'lucide-react';

const Header = ({ patterns }) => {
  return (
    <header className="header">
      <div className="logo">
        <Key size={48} className="key-icon" />
        <div className="logo-text">
          <h1>Sesame Multi-Modal</h1>
          <div className="logo-subtitle">Authentication of the Arabian Nights</div>
        </div>
      </div>
      <div className="methods-indicator">
        {patterns.voice && <span className="badge voice-badge">🎤 Voice</span>}
        {patterns.emoji && <span className="badge emoji-badge">😊 Emoji</span>}
        {patterns.color && <span className="badge color-badge">🎨 Color</span>}
        {patterns.shape && <span className="badge shape-badge">🧩 Shape</span>}
      </div>
    </header>
  );
};

export default Header;
