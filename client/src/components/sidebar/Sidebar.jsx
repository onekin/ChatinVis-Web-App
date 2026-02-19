import { Home, Star, Settings, Brain, TrendingUp, Sparkles } from 'lucide-react';
import './Sidebar.css';
import { mapService } from '../../services/mapService';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const [mapcount, setMapcount] = useState(0);

  useEffect(() => {
    const fetchMapCount = async () => {
      try {
        const maps = await mapService.getAllMaps();
        setMapcount(maps.length);
      } catch (error) {
        console.error('Error fetching map count:', error);
      }
    };
    fetchMapCount();
  }, []);
  const stats = [
    { label: 'Maps created', value: mapcount , color: 'cyan' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-compact">
          <div className="logo-symbol">
            <Brain size={24} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="sidebar-title">ChatInVis</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <button className="nav-item active">
            <div className="nav-icon">
              <Home size={20} />
            </div>
            <span className="nav-label">Home</span>
          </button>
          <button className="nav-item">
            <div className="nav-icon">
              <Star size={20} />
            </div>
            <span className="nav-label">Favorites</span>
          </button>
          <button className="nav-item">
            <div className="nav-icon">
              <Settings size={20} />
            </div>
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-stats">
        <div className="stats-header">
          <TrendingUp size={16} />
          <span>Your activity</span>
        </div>
        {stats.map((stat, index) => (
          <div key={index} className={`stat-item ${stat.color}`}>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
          </div>
        ))}
      </div>

      
    </aside>
  );
};

export default Sidebar;