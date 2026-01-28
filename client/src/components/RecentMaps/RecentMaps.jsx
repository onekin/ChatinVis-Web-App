import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MoreHorizontal, Star, Sparkles, Clock, User, Trash2, Edit } from 'lucide-react';
import './RecentMaps.css';

import { useMapData } from '../../context/MapDataContext';

const RecentMaps = () => {
  const navigate = useNavigate();
  const { recentMaps, toggleStar, deleteMap, isDeleting } = useMapData();
  const [activeMenu, setActiveMenu] = useState(null);

  // Handle opening a map
  const handleOpenMap = useCallback((mapId) => {
    navigate('/editor', { state: { mapId } });
  }, [navigate]);

  // Handle toggling star
  const handleToggleStar = useCallback(async (e, mapId, currentStarred) => {
    e.stopPropagation();
    try {
      await toggleStar({ id: mapId, isStarred: !currentStarred });
      toast.success(currentStarred ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
      console.error('Error toggling star:', error);
    }
  }, [toggleStar]);

  // Handle deleting a map
  const handleDeleteMap = useCallback(async (e, mapId, mapName) => {
    e.stopPropagation();
    setActiveMenu(null);

    if (window.confirm(`Are you sure you want to delete "${mapName}"?`)) {
      try {
        toast.loading('Deleting map...', { id: 'delete-map' });
        await deleteMap(mapId);
        toast.success('Map deleted successfully', { id: 'delete-map' });
      } catch (error) {
        toast.error('Failed to delete map', { id: 'delete-map' });
        console.error('Error deleting map:', error);
      }
    }
  }, [deleteMap]);

  // Toggle menu
  const handleMenuToggle = useCallback((e, mapId) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === mapId ? null : mapId);
  }, [activeMenu]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -10,
      transition: {
        duration: 0.15
      }
    }
  };

  return (
    <motion.div
      className="recent-maps-container"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      <motion.div className="recent-maps-header" variants={cardVariants}>
        <h2 className="section-title">Recent</h2>
        <motion.button
          className="view-all-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast('View all maps coming soon!', { icon: '📋' })}
        >
          View all
        </motion.button>
      </motion.div>

      <motion.div className="maps-grid" variants={containerVariants}>
        {recentMaps.map((map) => (
          <motion.div
            key={map.id}
            className={`map-card ${map.color}`}
            onClick={() => handleOpenMap(map.id)}
            variants={cardVariants}
            whileHover={{
              scale: 1.02,
              y: -4,
              boxShadow: '0 12px 40px rgba(77, 208, 225, 0.15)'
            }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            <div className="map-card-header">
              <div className="map-card-badges">
                {map.aiGenerated && (
                  <motion.span
                    className="ai-chip"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Sparkles size={12} />
                  </motion.span>
                )}
                <span className="category-chip">{map.category}</span>
              </div>
              <div className="map-card-actions">
                <motion.button
                  className={`star-action ${map.starred ? 'starred' : ''}`}
                  onClick={(e) => handleToggleStar(e, map.id, map.starred)}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star size={16} fill={map.starred ? 'currentColor' : 'none'} />
                </motion.button>
                <div className="menu-container">
                  <motion.button
                    className="more-action"
                    onClick={(e) => handleMenuToggle(e, map.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreHorizontal size={16} />
                  </motion.button>

                  <AnimatePresence>
                    {activeMenu === map.id && (
                      <motion.div
                        className="dropdown-menu"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <button
                          className="menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(null);
                            handleOpenMap(map.id);
                          }}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="menu-item danger"
                          onClick={(e) => handleDeleteMap(e, map.id, map.name)}
                          disabled={isDeleting}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="map-card-body">
              <h3 className="map-card-title">{map.name}</h3>
              <div className="map-card-meta">
                <span className="meta-item">
                  <span className="meta-dot"></span>
                  {map.nodes} {map.nodes === 1 ? 'node' : 'nodes'}
                </span>
              </div>
            </div>

            <div className="map-card-footer">
              <div className="map-card-user">
                <User size={14} />
                <span>{map.createdBy}</span>
              </div>
              <div className="map-card-time">
                <Clock size={14} />
                <span>{map.modified}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default RecentMaps;
