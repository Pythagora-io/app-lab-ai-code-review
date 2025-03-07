const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const axios = require('axios');

// Check if user has access to the GitHub repository
const checkRepoAccess = async (repoUrl, token) => {
  try {
    // Parse the URL to extract owner and repo name
    const url = new URL(repoUrl);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);

    if (pathParts.length < 2) {
      console.log(`Invalid repository URL format: ${repoUrl}`);
      return {
        hasAccess: false,
        error: 'Invalid repository URL format'
      };
    }

    const owner = pathParts[0];
    const repo = pathParts[1];

    console.log(`Checking access to GitHub repository: ${owner}/${repo}`);

    // Make a request to GitHub API to check repo existence and access
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      console.log(`Repository ${owner}/${repo} exists and is accessible`);

      // Get file count (simplified version - in a real implementation, you would need pagination)
      const contentsResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      let fileCount = 0;
      if (contentsResponse.data.tree) {
        fileCount = contentsResponse.data.tree.filter(item => item.type === 'blob').length;
        console.log(`Repository contains approximately ${fileCount} files`);
      }

      // Get the latest commit hash
      const commitsResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 1
          }
        }
      );

      let commitHash = null;
      if (commitsResponse.data && commitsResponse.data.length > 0) {
        commitHash = commitsResponse.data[0].sha;
        console.log(`Latest commit hash: ${commitHash}`);
      }

      return {
        hasAccess: true,
        fileCount: fileCount,
        commitHash: commitHash
      };
    } catch (apiError) {
      console.error('GitHub API error:', apiError.message);
      
      if (apiError.response) {
        if (apiError.response.status === 404) {
          return {
            hasAccess: false,
            error: 'Repository not found or private. Please check the URL and your access permissions.'
          };
        } else if (apiError.response.status === 403) {
          return {
            hasAccess: false,
            error: 'API rate limit exceeded or insufficient permissions to access the repository.'
          };
        }
      }

      return {
        hasAccess: false,
        error: apiError.message || 'Failed to check repository access'
      };
    }
  } catch (error) {
    console.error('Error checking repo access:', error);
    return {
      hasAccess: false,
      error: error.message || 'Failed to check repository access'
    };
  }
};

// Clone a GitHub repository to a temporary directory
const cloneRepository = async (repoUrl, token) => {
  try {
    const repoId = uuidv4();
    const tempDir = path.join(os.tmpdir(), `repo-${repoId}`);

    console.log(`Cloning repository ${repoUrl} to temporary directory ${tempDir}`);

    // Create temp directory
    await fs.ensureDir(tempDir);

    // Parse the URL to handle it properly
    const url = new URL(repoUrl);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);

    if (pathParts.length < 2) {
      console.error(`Invalid repository URL format: ${repoUrl}`);
      return {
        success: false,
        error: 'Invalid repository URL format'
      };
    }

    // Format the URL correctly for GitHub authentication
    // Don't include the token directly in the repo URL
    const gitUrl = `https://${token}@github.com/${pathParts[0]}/${pathParts[1]}.git`;

    console.log(`Attempting to clone repository with authentication`);

    // Clone the repository
    await simpleGit().clone(gitUrl, tempDir);

    console.log(`Successfully cloned repository to ${tempDir}`);

    return {
      success: true,
      tempDir,
      repoId
    };
  } catch (error) {
    console.error('Error cloning repository:', error);
    return {
      success: false,
      error: error.message || 'Failed to clone repository. Please verify the repository URL and your GitHub token.'
    };
  }
};

// Count the number of files in a repository
const countFiles = async (repoDir) => {
  try {
    console.log(`Counting files in repository at ${repoDir}`);
    let fileCount = 0;

    const countFilesRecursive = async (dir) => {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        // Skip .git directory
        if (file === '.git') continue;

        if (stat.isDirectory()) {
          await countFilesRecursive(filePath);
        } else {
          fileCount++;
        }
      }
    };

    await countFilesRecursive(repoDir);
    console.log(`Repository contains ${fileCount} files`);
    return fileCount;
  } catch (error) {
    console.error('Error counting files:', error);
    throw error;
  }
};

// Get the latest commit hash from a repository
const getLatestCommitHash = async (repoDir) => {
  try {
    console.log(`Getting latest commit hash for repository at ${repoDir}`);
    const git = simpleGit(repoDir);
    const log = await git.log({ maxCount: 1 });
    console.log(`Latest commit hash: ${log.latest.hash}`);
    return log.latest.hash;
  } catch (error) {
    console.error('Error getting latest commit hash:', error);
    throw error;
  }
};

// Cleanup temporary directory
const cleanupRepo = async (tempDir) => {
  try {
    console.log(`Cleaning up temporary directory at ${tempDir}`);
    await fs.remove(tempDir);
    console.log(`Successfully removed ${tempDir}`);
    return true;
  } catch (error) {
    console.error('Error cleaning up repo:', error);
    return false;
  }
};

module.exports = {
  checkRepoAccess,
  cloneRepository,
  countFiles,
  getLatestCommitHash,
  cleanupRepo
};