import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const validateConfig = async () => {
  const response = await api.post('/api/config/validate');
  return response.data;
};

export const startAnalysis = async (brands) => {
  const response = await api.post('/api/analyze', { brands });
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
};

export const listJobs = async () => {
  const response = await api.get('/api/jobs');
  return response.data;
};

export const downloadReport = (jobId) => {
  window.open(`${API_BASE_URL}/api/reports/${jobId}/download`, '_blank');
};

export default api;
