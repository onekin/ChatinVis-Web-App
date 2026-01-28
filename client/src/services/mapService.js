import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Map Service
export const mapService = {
  // Get all user's mind maps
  getAllMaps: async () => {
    try {
      const response = await api.get('/mindmap');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching maps:', error);
      throw error;
    }
  },

  // Get recent mind maps
  getRecentMaps: async () => {
    try {
      const response = await api.get('/mindmap/recent');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent maps:', error);
      throw error;
    }
  },

  // Get mind map by ID
  getMapById: async (id) => {
    try {
      const response = await api.get(`/mindmap/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching map:', error);
      throw error;
    }
  },

  // Create new mind map
  createMap: async (mapData) => {
    try {
      const response = await api.post('/mindmap', mapData);
      console.log('Create map response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating map:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Update mind map
  updateMap: async (id, mapData) => {
    try {
      const response = await api.put(`/mindmap/${id}`, mapData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating map:', error);
      throw error;
    }
  },

  // Delete mind map
  deleteMap: async (id) => {
    try {
      const response = await api.delete(`/mindmap/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting map:', error);
      throw error;
    }
  },

  // Save mind map state
  saveMindMapState: async (id, state) => {
    try {
      const response = await api.post(`/mindmap/${id}/save`, state);
      return response.data.data;
    } catch (error) {
      console.error('Error saving map state:', error);
      throw error;
    }
  },

  // Toggle star status
  toggleStar: async (id, isStarred) => {
    try {
      const response = await api.put(`/mindmap/${id}`, { isStarred });
      return response.data.data;
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  },
};

export default mapService;
