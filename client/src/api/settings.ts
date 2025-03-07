import api from './api';

// Description: Save user settings
// Endpoint: POST /api/settings
// Request: { githubToken: string, openaiKey: string }
// Response: { success: boolean, message: string }
export const saveSettings = async (data: { githubToken: string; openaiKey: string }) => {
  try {
    const response = await api.post('/api/settings', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get user settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { githubToken: string | null, openaiKey: string | null }
export const getSettings = async () => {
  try {
    const response = await api.get('/api/settings');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};