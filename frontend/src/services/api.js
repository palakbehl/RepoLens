import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5086/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export const apiService = {
  // GET /repositories
  async getRepositories() {
    const response = await apiClient.get('/repositories');
    return response.data;
  },

  // GET /repositories/{id}
  async getRepository(id) {
    const response = await apiClient.get(`/repositories/${id}`);
    return response.data;
  },

  // GET /repositories/{id}/analysis
  async getLatestAnalysis(id) {
    const response = await apiClient.get(`/repositories/${id}/analysis`);
    return response.data;
  },

  // GET /repositories/{id}/history
  async getRepositoryHistory(id) {
    const response = await apiClient.get(`/repositories/${id}/history`);
    return response.data;
  },

  // POST /repositories
  async addRepository(gitHubUrl) {
    const response = await apiClient.post('/repositories', { gitHubUrl });
    return response.data;
  },

  // POST /repositories/{id}/review
  async generateAIReview(id) {
    const response = await apiClient.post(`/repositories/${id}/review`);
    return response.data;
  },

  // POST /repositories/{id}/analyze
  async analyzeRepository(id) {
    const response = await apiClient.post(`/repositories/${id}/analyze`);
    return response.data;
  },
};

export default apiService;
