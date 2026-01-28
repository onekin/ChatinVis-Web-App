import axios from 'axios';

class UploadService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 60000
    });
  }


  async uploadSingleFile(file, onUploadProgress = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {};

      if (onUploadProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        };
      }

      const response = await this.apiClient.post('/upload/single', formData, config);

      if (response.data.success) {
        console.log(' File uploaded successfully:', response.data.file);
        return response.data.file;
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error(' Upload error:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files, onUploadProgress = null) {
    try {
      const formData = new FormData();

      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const config = {};

      if (onUploadProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        };
      }

      const response = await this.apiClient.post('/upload/multiple', formData, config);

      if (response.data.success) {
        console.log(` ${response.data.files.length} files uploaded successfully`);
        return response.data.files;
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error(' Upload error:', error);
      throw error;
    }
  }

  async deleteFile(filename) {
    try {
      const response = await this.apiClient.delete(`/upload/${filename}`);

      if (response.data.success) {
        console.log('  File deleted successfully:', filename);
        return response.data;
      }

      throw new Error('Delete failed');
    } catch (error) {
      console.error(' Delete error:', error);
      throw error;
    }
  }

  getFileUrl(filename) {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseURL}/uploads/${filename}`;
  }
}

const uploadService = new UploadService();
export default uploadService;
