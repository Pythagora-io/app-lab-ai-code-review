const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  repoUrl: {
    type: String,
    required: true,
    trim: true
  },
  analysisId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  progress: {
    type: Number,
    default: 0
  },
  results: [{
    category: String,
    suggestions: [String]
  }],
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastCommitHash: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);