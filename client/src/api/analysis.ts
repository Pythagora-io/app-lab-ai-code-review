import api from './api';

// Description: Analyze GitHub repository
// Endpoint: POST /api/analysis
// Request: { repoUrl: string }
// Response: { analysisId: string, status: 'processing' | 'completed' | 'error', progress: number }
export const analyzeRepo = (repoUrl: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        analysisId: '123',
        status: 'processing',
        progress: 0,
      });
    }, 500);
  });
};

// Description: Get analysis status
// Endpoint: GET /api/analysis/:id
// Request: {}
// Response: { status: 'processing' | 'completed' | 'error', progress: number, results?: Array<{ category: string, suggestions: string[] }> }
export const getAnalysisStatus = (id: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'completed',
        progress: 100,
        results: [
          {
            category: 'Best Practices',
            suggestions: [
              'Consider using TypeScript for better type safety',
              'Implement proper error handling in async functions',
            ],
          },
          {
            category: 'Performance',
            suggestions: [
              'Use React.memo for expensive components',
              'Implement code splitting using React.lazy',
            ],
          },
          {
            category: 'Security',
            suggestions: [
              'Update dependencies with known vulnerabilities',
              'Implement proper input validation',
            ],
          },
        ],
      });
    }, 500);
  });
};