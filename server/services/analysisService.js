const Analysis = require('../models/Analysis');
const Settings = require('../models/Settings');
const { decrypt } = require('../utils/encryption');
const {
  checkRepoAccess,
  cloneRepository,
  countFiles,
  getLatestCommitHash,
  cleanupRepo
} = require('./githubService');
const { analyzeRepositoryWithOpenAI } = require('./openaiService');
const { v4: uuidv4 } = require('uuid');

// Get user settings and decrypt sensitive data
const getUserSettings = async (userId) => {
  try {
    console.log(`Getting settings for user ID: ${userId}`);
    let settings = await Settings.findOne({ userId });

    if (!settings) {
      console.log(`No settings found for user ID: ${userId}`);
      return null;
    }

    console.log(`Settings found for user ID: ${userId}`);

    // Return settings with decrypted tokens
    return {
      _id: settings._id,
      userId: settings.userId,
      githubToken: settings.githubToken ? decrypt(settings.githubToken) : null,
      openaiApiKey: settings.openaiApiKey ? decrypt(settings.openaiApiKey) : null,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

// Create a new analysis
const createAnalysis = async (userId, repoUrl) => {
  try {
    // Get user settings for GitHub token
    const settings = await getUserSettings(userId);

    if (!settings || !settings.githubToken) {
      throw new Error('GitHub token not found. Please configure it in settings.');
    }

    if (!settings.openaiApiKey) {
      throw new Error('OpenAI API key not found. Please configure it in settings.');
    }

    // Check if repository exists and is accessible BEFORE creating an Analysis record
    console.log(`Checking access to repository: ${repoUrl}`);
    const accessCheck = await checkRepoAccess(repoUrl, settings.githubToken);

    if (!accessCheck.hasAccess) {
      console.error(`Repository access check failed: ${accessCheck.error}`);
      // Don't save to database if repo doesn't exist or user can't access it
      throw new Error(accessCheck.error || 'Unable to access repository');
    }

    // Check file count limitation
    if (accessCheck.fileCount > 500) {
      console.error(`Repository has too many files: ${accessCheck.fileCount}`);
      throw new Error('Repository has more than 500 files, which exceeds the limit');
    }

    console.log(`Repository access check passed for: ${repoUrl}`);

    // Check if analysis already exists for this repo
    const existingAnalysis = await Analysis.findOne({
      repoUrl,
      status: { $in: ['processing', 'completed'] }
    });

    if (existingAnalysis) {
      console.log(`Found existing analysis for repo: ${repoUrl} with commit hash: ${existingAnalysis.lastCommitHash}`);

      // If the commit hash matches, return the existing analysis
      if (existingAnalysis.lastCommitHash === accessCheck.commitHash) {
        console.log(`Commit hash matches, returning existing analysis`);
        return existingAnalysis;
      } else {
        // If commit hash is different, delete the old analysis and create a new one
        console.log(`Commit hash different (DB: ${existingAnalysis.lastCommitHash}, New: ${accessCheck.commitHash}), deleting old analysis`);
        await Analysis.findByIdAndDelete(existingAnalysis._id);
        console.log(`Old analysis deleted, will create a new one`);
      }
    }

    // Only create the Analysis record after we've verified access
    const analysisId = uuidv4();
    const analysis = new Analysis({
      repoUrl,
      analysisId,
      status: 'processing',
      progress: 0,
      lastCommitHash: accessCheck.commitHash
    });

    await analysis.save();
    console.log(`Analysis created with ID: ${analysis.analysisId}`);

    // Start the analysis process in the background
    processRepository(analysis._id, userId, repoUrl, settings);

    return analysis;
  } catch (error) {
    console.error('Error creating analysis:', error);
    throw error;
  }
};

// Process repository asynchronously
const processRepository = async (analysisId, userId, repoUrl, settings) => {
  try {
    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      console.error('Analysis not found');
      return;
    }

    // Clone repository
    const cloneResult = await cloneRepository(repoUrl, settings.githubToken);

    if (!cloneResult.success) {
      // Update the record with error but don't expose sensitive info
      await Analysis.findByIdAndUpdate(analysisId, {
        status: 'error',
        error: cloneResult.error || 'Error cloning repository'
      });
      return;
    }

    // Get file count and commit hash
    const tempDir = cloneResult.tempDir;
    const fileCount = await countFiles(tempDir);
    const commitHash = await getLatestCommitHash(tempDir);

    // Update analysis with commit hash
    await Analysis.findByIdAndUpdate(analysisId, { lastCommitHash: commitHash });

    // Start analysis with OpenAI
    const analysisResult = await analyzeRepositoryWithOpenAI(
      tempDir,
      settings.openaiApiKey,
      async (progress) => {
        // Update progress in the database
        await Analysis.findByIdAndUpdate(analysisId, { progress });
      }
    );

    if (analysisResult.success) {
      // Update analysis with results
      await Analysis.findByIdAndUpdate(analysisId, {
        status: 'completed',
        progress: 100,
        results: analysisResult.results
      });
    } else {
      // Update analysis with error
      await Analysis.findByIdAndUpdate(analysisId, {
        status: 'error',
        error: analysisResult.error || 'Error analyzing repository'
      });
    }

    // Cleanup
    await cleanupRepo(tempDir);
  } catch (error) {
    console.error('Error processing repository:', error);

    // Update analysis with error
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'error',
      error: error.message || 'Error processing repository'
    });
  }
};

// Get analysis by ID
const getAnalysisById = async (analysisId) => {
  try {
    console.log(`Fetching analysis with ID: ${analysisId}`);
    const analysis = await Analysis.findOne({ analysisId });
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    return analysis;
  } catch (error) {
    console.error('Error getting analysis:', error);
    throw error;
  }
};

module.exports = {
  createAnalysis,
  getAnalysisById
};