import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mapService } from '../services/mapService';

const MapDataContext = createContext(null);

export const MapDataProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Framework state management
  const [frameworkConfig, setFrameworkConfig] = useState(() => {
    const enabled = localStorage.getItem('mindinvis_framework_enabled') === 'true';
    if (!enabled) {
      return null;
    }
    
    const type = localStorage.getItem('mindinvis_framework_type') || 'predefined';
    const value = localStorage.getItem('mindinvis_framework_value') || 'cause-consequences';
    
    return { enabled: true, type, value };
  });

  // Update framework configuration
  const updateFrameworkConfig = (config) => {
    console.log('MapDataContext: Updating framework config:', config);
    setFrameworkConfig(config);
    if (config && config.enabled) {
      console.log('MapDataContext: Saving to localStorage:', {
        type: config.type,
        value: config.value
      });
      localStorage.setItem('mindinvis_framework_enabled', 'true');
      localStorage.setItem('mindinvis_framework_type', config.type);
      localStorage.setItem('mindinvis_framework_value', config.value);
    } else {
      console.log('MapDataContext: Removing from localStorage');
      localStorage.removeItem('mindinvis_framework_enabled');
      localStorage.removeItem('mindinvis_framework_type');
      localStorage.removeItem('mindinvis_framework_value');
    }
  };

  // Fetch all maps
  const { data: allMaps = [], isLoading: isLoadingAllMaps } = useQuery({
    queryKey: ['maps'],
    queryFn: mapService.getAllMaps,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch recent maps
  const { data: recentMapsData = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recentMaps'],
    queryFn: async () => {
      console.log('Fetching recent maps...');
      const result = await mapService.getRecentMaps();
      console.log('Recent maps response:', result);
      return result;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create map mutation
  const createMapMutation = useMutation({
    mutationFn: mapService.createMap,
    onSuccess: async (data) => {
      console.log('Map created successfully:', data);
      console.log('Invalidating and refetching queries...');
      await queryClient.invalidateQueries({ queryKey: ['maps'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['recentMaps'], refetchType: 'active' });
      console.log('Queries invalidated and refetched');
    },
  });

  // Update map mutation
  const updateMapMutation = useMutation({
    mutationFn: ({ id, data }) => mapService.updateMap(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['maps']);
      queryClient.invalidateQueries(['recentMaps']);
    },
  });

  // Delete map mutation
  const deleteMapMutation = useMutation({
    mutationFn: mapService.deleteMap,
    onSuccess: () => {
      queryClient.invalidateQueries(['maps']);
      queryClient.invalidateQueries(['recentMaps']);
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: ({ id, isStarred }) => mapService.toggleStar(id, isStarred),
    onSuccess: () => {
      queryClient.invalidateQueries(['maps']);
      queryClient.invalidateQueries(['recentMaps']);
    },
  });

  // Quick actions for creating new maps
  const quickActions = useMemo(() => [
    {
      icon: 'Plus',
      label: 'Blank map',
      description: 'Start from scratch',
      size: 'large',
      color: 'cyan',
    },
    {
      icon: 'Sparkles',
      label: 'AI Generated',
      description: 'Let AI create a map',
      size: 'medium',
      color: 'purple',
    },
    {
      icon: 'BookOpen',
      label: 'From template',
      description: 'Use a preset structure',
      size: 'medium',
      color: 'blue',
    },
  ], []);

  // Templates for quick start
  const templates = useMemo(() => [
    { icon: 'Target', label: 'Goal Planning', color: 'cyan' },
    { icon: 'Briefcase', label: 'Project', color: 'purple' },
    { icon: 'Brain', label: 'Brainstorm', color: 'blue' },
    { icon: 'FileText', label: 'Notes', color: 'pink' },
    { icon: 'Lightbulb', label: 'Ideas', color: 'orange' },
  ], []);

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Format recent maps for display
  const recentMaps = useMemo(() => {
    console.log('Transforming recent maps data...');
    console.log('Raw recentMapsData:', recentMapsData);

    if (!Array.isArray(recentMapsData)) {
      console.warn('recentMapsData is not an array:', recentMapsData);
      return [];
    }

    const transformed = recentMapsData.map((map) => {
      console.log('Processing map:', {
        _id: map._id,
        title: map.title,
        nodes: map.nodes,
        owner: map.owner,
        updatedAt: map.updatedAt
      });

      return {
        id: map._id || map.id,
        name: map.title || 'Untitled',
        category: map.category || 'Other',
        nodes: Array.isArray(map.nodes) ? map.nodes.length : 0,
        createdBy: map.owner?.name || map.owner?.email || 'Unknown',
        modified: map.updatedAt ? formatRelativeTime(map.updatedAt) : 'Unknown',
        starred: map.isStarred || false,
        aiGenerated: map.aiGenerated || false,
        color: map.color || 'cyan',
      };
    });

    console.log('Transformed recent maps:', transformed);
    return transformed;
  }, [recentMapsData]);

  const value = {
    // Data
    quickActions,
    templates,
    recentMaps,
    allMaps,

    // Framework configuration
    frameworkConfig,
    updateFrameworkConfig,

    // Loading states
    isLoadingAllMaps,
    isLoadingRecent,

    // Mutations (using mutateAsync to return promises with results)
    createMap: createMapMutation.mutateAsync,
    updateMap: updateMapMutation.mutateAsync,
    deleteMap: deleteMapMutation.mutateAsync,
    toggleStar: toggleStarMutation.mutateAsync,

    // Loading states for mutations
    isCreating: createMapMutation.isPending,
    isUpdating: updateMapMutation.isPending,
    isDeleting: deleteMapMutation.isPending,
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
};
