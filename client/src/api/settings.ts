import api from './api';

// Description: Save user settings
// Endpoint: POST /api/settings
// Request: { githubToken: string, openaiKey: string }
// Response: { success: boolean, message: string }
export const saveSettings = (data: { githubToken: string; openaiKey: string }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Settings saved successfully' });
    }, 500);
  });
};

// Description: Get user settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { githubToken: string, openaiKey: string }
export const getSettings = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        githubToken: 'github_pat_xxx',
        openaiKey: 'sk-xxx',
      });
    }, 500);
  });
};