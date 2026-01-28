import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  Brain,
  Plus,
  BookOpen,
  Target,
  Briefcase,
  FileText,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MapGrid.css';

import { useMapData } from '../../context/MapDataContext';

const iconMap = {
  Sparkles,
  Plus,
  BookOpen,
  FileText,
  Target,
  Briefcase,
  Brain,
  Lightbulb
};

const MapGrid = () => {
  const navigate = useNavigate();
  const { quickActions, templates, createMap, isCreating } = useMapData();

  // Handle creating a blank map
  const handleCreateBlankMap = useCallback(async () => {
    try {
      toast.loading('Creating blank map...', { id: 'create-map' });
      const newMap = await createMap({
        title: 'Untitled map',
        category: 'Other',
      });

      console.log('New map created:', newMap);

      const mapId = newMap?._id || newMap?.id;
      if (!mapId) {
        console.error('Map data:', newMap);
        throw new Error('Invalid response from server: missing map ID');
      }

      toast.success('Map created successfully!', { id: 'create-map' });
      navigate('/editor', { state: { mapId } });
    } catch (error) {
      toast.error('Failed to create map. Please try again.', { id: 'create-map' });
      console.error('Error creating map:', error);
    }
  }, [createMap, navigate]);

  // Handle creating a map from template
  const handleCreateFromTemplate = useCallback(async (templateName) => {
    try {
      toast.loading(`Creating ${templateName} map...`, { id: 'create-map' });
      const newMap = await createMap({
        title: `${templateName} Map`,
        category: templateName === 'Project' ? 'Work' : 'Other',
      });

      console.log('New map created:', newMap);

      const mapId = newMap?._id || newMap?.id;
      if (!mapId) {
        console.error('Map data:', newMap);
        throw new Error('Invalid response from server: missing map ID');
      }

      toast.success('Map created successfully!', { id: 'create-map' });
      navigate('/editor', { state: { mapId } });
    } catch (error) {
      toast.error('Failed to create map. Please try again.', { id: 'create-map' });
      console.error('Error creating map:', error);
    }
  }, [createMap, navigate]);

  // Handle quick actions
  const handleActionClick = useCallback((action) => {
    if (action.label === 'Blank map') {
      handleCreateBlankMap();
    } else if (action.label === 'AI Generated') {
      toast('AI generation coming soon!', {
        icon: '🤖',
      });
    } else if (action.label === 'From template') {
      toast('Select a template below', {
        icon: '👇',
      });
    }
  }, [handleCreateBlankMap]);

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

  return (
    <motion.div
      className="map-grid-container"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      <motion.div className="section-header" variants={itemVariants}>
        <h2 className="section-title">Create new</h2>
      </motion.div>

      <motion.div className="bento-grid" variants={containerVariants}>
        {quickActions.map((action, index) => {
          const Icon = iconMap[action.icon];
          return (
            <motion.button
              key={index}
              className={`bento-card ${action.size} ${action.color}`}
              onClick={() => handleActionClick(action)}
              disabled={isCreating}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bento-content">
                <div className="bento-icon">
                  <Icon size={action.size === 'large' ? 32 : 24} strokeWidth={2} />
                </div>
                <div className="bento-text">
                  <h3 className="bento-label">{action.label}</h3>
                  <p className="bento-description">{action.description}</p>
                </div>
                <ArrowRight className="bento-arrow" size={20} />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div className="templates-section" variants={itemVariants}>
        <h3 className="templates-title">Quick templates</h3>
        <div className="templates-grid">
          {templates.map((template, index) => {
            const Icon = iconMap[template.icon];
            return (
              <motion.button
                key={index}
                className={`template-chip ${template.color}`}
                onClick={() => handleCreateFromTemplate(template.label)}
                disabled={isCreating}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Icon size={16} />
                <span>{template.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MapGrid;
