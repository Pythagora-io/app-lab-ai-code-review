const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { requireUser } = require('./middleware/auth');
const axios = require('axios');
const { encrypt, decrypt } = require('../utils/encryption');

// Get user settings
router.get('/', requireUser, async (req, res) => {
  try {
    console.log(`Getting settings for user ID: ${req.user._id}`);
    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      console.log(`No settings found for user ID: ${req.user._id}`);
      return res.status(200).json({
        githubToken: null,
        openaiKey: null
      });
    }

    console.log(`Settings found for user ID: ${req.user._id}`);
    
    // Decrypt the tokens before sending to client
    return res.status(200).json({
      githubToken: settings.githubToken ? decrypt(settings.githubToken) : null,
      openaiKey: settings.openaiApiKey ? decrypt(settings.openaiApiKey) : null
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Save user settings
router.post('/', requireUser, async (req, res) => {
  try {
    const { githubToken, openaiKey } = req.body;

    console.log(`Saving settings for user ID: ${req.user._id}`);

    // Validate GitHub token if provided
    if (githubToken) {
      try {
        console.log('Validating GitHub token...');
        const githubResponse = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${githubToken}`
          }
        });

        if (githubResponse.status !== 200) {
          console.error('Invalid GitHub token');
          return res.status(400).json({ error: 'Invalid GitHub token' });
        }
        console.log('GitHub token is valid');
      } catch (error) {
        console.error('Error validating GitHub token:', error);
        // Extract the specific error message from GitHub API
        const errorMessage = error.response?.data?.message
          ? `GitHub API error: ${error.response.data.message}`
          : 'Invalid GitHub token';
        return res.status(400).json({ error: errorMessage });
      }
    }

    // Validate OpenAI API key if provided
    if (openaiKey) {
      try {
        console.log('Validating OpenAI API key...');
        const openaiResponse = await axios.get('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${openaiKey}`
          }
        });

        if (openaiResponse.status !== 200) {
          console.error('Invalid OpenAI API key');
          return res.status(400).json({ error: 'Invalid OpenAI API key' });
        }
        console.log('OpenAI API key is valid');
      } catch (error) {
        console.error('Error validating OpenAI API key:', error);
        // Extract the specific error message from OpenAI API
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message
          ? `OpenAI API error: ${error.response?.data?.error?.message || error.response?.data?.message}`
          : 'Invalid OpenAI API key';
        return res.status(400).json({ error: errorMessage });
      }
    }

    // Update or create settings
    let settings = await Settings.findOne({ userId: req.user._id });

    // Encrypt the tokens before saving
    const encryptedGithubToken = githubToken ? encrypt(githubToken) : null;
    const encryptedOpenaiKey = openaiKey ? encrypt(openaiKey) : null;

    if (settings) {
      console.log(`Updating existing settings for user ID: ${req.user._id}`);
      if (githubToken) settings.githubToken = encryptedGithubToken;
      if (openaiKey) settings.openaiApiKey = encryptedOpenaiKey;
      await settings.save();
    } else {
      console.log(`Creating new settings for user ID: ${req.user._id}`);
      settings = new Settings({
        userId: req.user._id,
        githubToken: encryptedGithubToken,
        openaiApiKey: encryptedOpenaiKey
      });
      await settings.save();
    }

    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;