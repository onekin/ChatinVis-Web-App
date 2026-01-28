import { Sparkles, Search, Command } from 'lucide-react';
import './Header.css';

const Header = ({ userName = "Ruben" }) => {
  return (
    <header className="header">
      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search maps or create new with AI..."
          className="search-input"
        />
        <div className="search-shortcut">
          <Command size={12} />
          <span>K</span>
        </div>
      </div>

      <div className="header-actions">
        <button className="ai-quick-button">
          <Sparkles size={16} />
        </button>
        <div className="user-menu">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <span className="user-name">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;