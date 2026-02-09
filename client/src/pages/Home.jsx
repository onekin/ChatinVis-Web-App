import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import {
  Sparkles,
  Brain
} from 'lucide-react';

import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import RecentMaps from '../components/RecentMaps/RecentMaps';
import { useMapData } from '../context/MapDataContext';
import './Home.css';

const Home = ({ userName }) => {
  const navigate = useNavigate();
  const { isLoadingRecent, recentMaps, createMap, isCreating } = useMapData();

  // Handle creating a new map
  const handleCreateNewMap = useCallback(async () => {
    try {
      const newMap = await createMap({
        title: 'Untitled map',
        category: 'Other',
      });
      toast.success('New map created!');
      navigate('/editor', { state: { mapId: newMap._id } });
    } catch (error) {
      toast.error('Failed to create map. Please try again.');
      console.error('Error creating map:', error);
    }
  }, [createMap, navigate]);


  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #2c3e87',
          },
          success: {
            iconTheme: {
              primary: '#4dd0e1',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff6b6b',
              secondary: '#fff',
            },
          },
        }}
      />
      <Sidebar />
      <main className="main-content">
        <Header userName={userName} />
        <div className="content-wrapper">
          {/* Hero Section */}
          <motion.section
            className="hero-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hero-content">
              <div className="hero-text">
                <motion.div className="hero-actions">
                  <motion.button
                    className="primary-btn"
                    onClick={handleCreateNewMap}
                    disabled={isCreating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles size={18} />
                    {isCreating ? 'Creating...' : 'Create Map'}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Recent Maps Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isLoadingRecent ? (
              <div className="loading-container">
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Brain size={32} />
                </motion.div>
                <p>Loading your maps...</p>
              </div>
            ) : recentMaps.length > 0 ? (
              <RecentMaps />
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Brain size={48} className="empty-icon" />
                <h3>No maps yet</h3>
                <p>Create your first mind map to get started</p>
                <motion.button
                  className="primary-btn"
                  onClick={handleCreateNewMap}
                  disabled={isCreating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles size={18} />
                  {isCreating ? 'Creating...' : 'Create First Map'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Home;
