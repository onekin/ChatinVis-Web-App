import axios from 'axios';

class DocumentService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 120000
    });

    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async uploadPDF(file, mindMapId, onUploadProgress = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mindMapId', mindMapId);

      const config = {};

      if (onUploadProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        };
      }

      console.log('Uploading PDF with RAG processing...', { mindMapId });
      const response = await this.apiClient.post('/documents/upload', formData, config);

      if (response.data.success) {
        console.log('PDF processed successfully:', response.data.document);
        return response.data.document;
      }

      throw new Error('PDF upload failed');
    } catch (error) {
      console.error('PDF upload error:', error);
      throw error;
    }
  }

  async searchChunks(documentId, query, topK = 5) {
    try {
      console.log(`Searching chunks in document ${documentId} for: "${query}"`);
      const response = await this.apiClient.post(`/documents/${documentId}/search`, {
        query,
        topK
      });

      if (response.data.success) {
        console.log(`Found ${response.data.results.length} relevant chunks`);
        return response.data.results;
      }

      throw new Error('Search failed');
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getStats(documentId) {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/stats`);

      if (response.data.success) {
        console.log('Document stats:', response.data.stats);
        return response.data.stats;
      }

      throw new Error('Failed to get stats');
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  async getDocument(documentId) {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}`);

      if (response.data.success) {
        console.log('Document info:', response.data.document);
        return response.data.document;
      }

      throw new Error('Failed to get document');
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }

  async downloadPDF(documentId) {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Download PDF error:', error);
      throw error;
    }
  }
}

const documentService = new DocumentService();
export default documentService;
