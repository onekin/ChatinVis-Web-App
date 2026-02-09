import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Header.css';

const Header = ({ userName = "Ruben" }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-actions">
        <div className="user-menu" ref={dropdownRef}>
          <div
            className="user-menu-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <span className="user-name">{userName}</span>
          </div>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <User size={16} />
                <span>{userName}</span>
              </div>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;