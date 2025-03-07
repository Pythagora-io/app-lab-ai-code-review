import api from './api';

// Description: Analyze GitHub repository
// Endpoint: POST /api/analysis
// Request: { repoUrl: string }
// Response: { analysisId: string, status: 'processing' | 'completed' | 'error', progress: number }
export const analyzeRepo = async (repoUrl: string) => {
  try {
    const response = await api.post('/api/analysis', { repoUrl });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get analysis status
// Endpoint: GET /api/analysis/:id
// Request: {}
// Response: { status: 'processing' | 'completed' | 'error', progress: number, results?: Array<{ category: string, suggestions: string[] }> }
export const getAnalysisStatus = async (id: string) => {
  try {
    const response = await api.get(`/api/analysis/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};