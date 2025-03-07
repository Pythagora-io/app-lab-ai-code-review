const express = require('express');
const router = express.Router();
const { createAnalysis, getAnalysisById } = require('../services/analysisService');
const { requireUser } = require('./middleware/auth');

// Create a new analysis
router.post('/', requireUser, async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      console.error('Repository URL is missing in request body');
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Validate URL format
    try {
      new URL(repoUrl);
    } catch (e) {
      console.error(`Invalid URL format: ${repoUrl}`, e);
      return res.status(400).json({ error: 'Invalid repository URL format' });
    }

    // Check if URL is from GitHub
    if (!repoUrl.includes('github.com')) {
      console.error(`Non-GitHub URL provided: ${repoUrl}`);
      return res.status(400).json({ error: 'Only GitHub repositories are supported' });
    }

    console.log(`Creating analysis for repository: ${repoUrl}`);
    const analysis = await createAnalysis(req.user._id, repoUrl);
    console.log(`Analysis created with ID: ${analysis.analysisId}`);

    return res.status(201).json({
      analysisId: analysis.analysisId,
      status: analysis.status,
      progress: analysis.progress
    });
  } catch (error) {
    console.error('Error creating analysis:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get analysis status
router.get('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching analysis with ID: ${id}`);
    
    const analysis = await getAnalysisById(id);

    const response = {
      status: analysis.status,
      progress: analysis.progress
    };

    // Include results if analysis is completed
    if (analysis.status === 'completed') {
      console.log(`Returning completed analysis results for ID: ${id}`);
      response.results = analysis.results;
    }

    // Include error message if analysis failed
    if (analysis.status === 'error') {
      console.error(`Analysis failed for ID: ${id} with error: ${analysis.error}`);
      response.error = analysis.error;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error getting analysis with ID: ${req.params.id}:`, error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;