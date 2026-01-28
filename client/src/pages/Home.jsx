import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import {
  Sparkles,
  ArrowRight,
  Grid3x3,
  Brain,
  Zap,
  Share2,
  Layers,
  X
} from 'lucide-react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import MapGrid from '../components/MapGrid/MapGrid';
import RecentMaps from '../components/RecentMaps/RecentMaps';
import { useMapData } from '../context/MapDataContext';
import './Home.css';

const Home = ({ userName }) => {
  const navigate = useNavigate();
  const [showFlow, setShowFlow] = useState(false);
  const { isLoadingRecent, recentMaps, createMap, isCreating } = useMapData();

  // Demo flow visualization nodes
  const flowNodes = useMemo(() => [
    {
      id: '1',
      data: { label: 'Mind Mapping' },
      position: { x: 250, y: 10 },
      style: {
        background: '#6a4c93',
        color: '#fff',
        border: '2px solid #8b5fc8',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    },
    {
      id: '2',
      data: { label: 'Visual Organization' },
      position: { x: 50, y: 150 },
      style: {
        background: '#4dd0e1',
        color: '#000',
        border: '2px solid #26c6da',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    },
    {
      id: '3',
      data: { label: 'AI Generation' },
      position: { x: 250, y: 150 },
      style: {
        background: '#5c7bc8',
        color: '#fff',
        border: '2px solid #4a5fa5',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    },
    {
      id: '4',
      data: { label: 'Collaboration' },
      position: { x: 450, y: 150 },
      style: {
        background: '#8b5fc8',
        color: '#fff',
        border: '2px solid #a78cd3',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    },
    {
      id: '5',
      data: { label: 'Export & Share' },
      position: { x: 250, y: 290 },
      style: {
        background: '#2c3e87',
        color: '#fff',
        border: '2px solid #5c7bc8',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    }
  ], []);

  const flowEdges = useMemo(() => [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8b5fc8', strokeWidth: 2 } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#5c7bc8', strokeWidth: 2 } },
    { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: '#8b5fc8', strokeWidth: 2 } },
    { id: 'e2-5', source: '2', target: '5', animated: true, style: { stroke: '#4dd0e1', strokeWidth: 2 } },
    { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#5c7bc8', strokeWidth: 2 } },
    { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#8b5fc8', strokeWidth: 2 } },
  ], []);

  const [nodes] = useNodesState(flowNodes);
  const [edges] = useEdgesState(flowEdges);

  // Features list
  const features = useMemo(() => [
    {
      icon: Grid3x3,
      title: 'Visual Canvas',
      description: 'Infinite canvas for organizing your thoughts with React Flow'
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Generate ideas, questions, and insights with LLM integration'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Instantly see changes as you explore and expand your mind maps'
    },
    {
      icon: Share2,
      title: 'Collaborate',
      description: 'Share your maps and work together seamlessly'
    },
    {
      icon: Layers,
      title: 'Deep Hierarchy',
      description: 'Unlimited levels of nested thoughts and connections'
    },
    {
      icon: Sparkles,
      title: 'Smart Context',
      description: 'AI understands your conversation flow for better suggestions'
    }
  ], []);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
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

  const flowVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

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
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="hero-content">
              <div className="hero-text">
                <motion.h1 className="hero-title" variants={itemVariants}>
                  Visualize Your Ideas
                  <br />
                  <span className="gradient-text">with AI Power</span>
                </motion.h1>
                <motion.p className="hero-subtitle" variants={itemVariants}>
                  Create beautiful mind maps powered by AI. Organize your thoughts, ask questions, and explore infinite possibilities.
                </motion.p>
                <motion.div className="hero-actions" variants={itemVariants}>
                  <motion.button
                    className="primary-btn"
                    onClick={() => navigate('/editor')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles size={18} />
                    Start Creating
                  </motion.button>
                  <motion.button
                    className="secondary-btn"
                    onClick={() => setShowFlow(!showFlow)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight size={18} />
                    See How It Works
                  </motion.button>
                </motion.div>
              </div>

              {/* Flow Visualization Preview */}
              <AnimatePresence>
                {showFlow && (
                  <motion.div
                    className="flow-preview"
                    variants={flowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="flow-container">
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                      >
                        <Background />
                        <Controls />
                      </ReactFlow>
                    </div>
                    <div className="flow-overlay">
                      <motion.button
                        className="close-flow"
                        onClick={() => setShowFlow(false)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={24} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Features Grid */}
          

          {/* Create New Maps Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}

          >
            <MapGrid />
          </motion.div>

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
