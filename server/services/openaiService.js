const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const { glob } = require('glob');
const util = require('util');

// Analyze a repository with OpenAI
// Description: Process repository files with OpenAI
// Input: { repoDir: string, openaiKey: string, onProgress: function }
// Output: { success: boolean, error?: string, results?: Array<{ category: string, suggestions: string[] }> }
const analyzeRepositoryWithOpenAI = async (repoDir, openaiKey, onProgress) => {
  try {
    console.log(`Starting OpenAI analysis for repository in ${repoDir}`);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    // Get all files in the repository
    const files = await glob('**/*', {
      cwd: repoDir,
      ignore: ['**/node_modules/**', '**/.git/**'],
      nodir: true,
    });

    console.log(`Found ${files.length} files to analyze`);

    // Set progress to 5% for initialization
    await onProgress(5);

    // Create file summaries for important files
    const fileSummaries = [];
    let fileCounter = 0;

    // Analyze a subset of files to avoid token limits (max 100 files)
    const maxFiles = Math.min(files.length, 100);
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.java', '.php', '.html', '.css', '.json'];

    // Filter files by relevant extensions
    const codesToAnalyze = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return relevantExtensions.includes(ext);
    }).slice(0, maxFiles);

    console.log(`Selected ${codesToAnalyze.length} code files for analysis`);

    // Analyze each file's content
    for (const file of codesToAnalyze) {
      fileCounter++;
      try {
        const filePath = path.join(repoDir, file);
        const content = await fs.readFile(filePath, 'utf8');

        // Skip large files to avoid token limits
        if (content.length > 50000) {
          console.log(`Skipping large file: ${file} (${content.length} bytes)`);
          continue;
        }

        console.log(`Analyzing file ${fileCounter}/${codesToAnalyze.length}: ${file}`);

        // Add file to summaries
        fileSummaries.push({
          file,
          content,
        });

        // Update progress based on files processed
        const progressPercentage = 5 + Math.floor(45 * (fileCounter / codesToAnalyze.length));
        await onProgress(progressPercentage);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    console.log(`Completed file summarization, sending to OpenAI for analysis`);
    await onProgress(50);

    // Send file structure to OpenAI
    const fileStructurePrompt = `
      I'm analyzing a GitHub repository and need insights on its structure.
      Here's a list of files in the project:
      ${files.slice(0, 200).join('\n')}
      ${files.length > 200 ? `\n...and ${files.length - 200} more files` : ''}
    `;

    console.log(`Getting repository structure analysis from OpenAI`);
    const structureResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a code review expert assistant that helps analyze codebases.' },
        { role: 'user', content: fileStructurePrompt }
      ],
    });

    const structureAnalysis = structureResponse.choices[0].message.content;
    console.log(`Received structure analysis from OpenAI`);
    await onProgress(60);

    // Create batches of file summaries for analysis using sliding window approach
    // Each batch will have some overlap with the next batch to maintain context
    const batchSize = 5;
    const overlap = 2; // Number of files to overlap between batches
    const summaryBatches = [];

    for (let i = 0; i < fileSummaries.length; i += (batchSize - overlap)) {
      // Ensure we don't go beyond array bounds
      const end = Math.min(i + batchSize, fileSummaries.length);
      // Only create a batch if we have at least one new file (not just overlap)
      if (i < fileSummaries.length - overlap) {
        summaryBatches.push(fileSummaries.slice(i, end));
      }
    }

    console.log(`Prepared ${summaryBatches.length} overlapping batches for analysis with ${overlap} file overlap`);

    // Analyze each batch
    const batchAnalyses = [];
    let batchCounter = 0;

    for (const batch of summaryBatches) {
      batchCounter++;
      console.log(`Analyzing batch ${batchCounter}/${summaryBatches.length}`);

      // Format files as a single prompt
      const batchPrompt = batch.map(({ file, content }) => (
        `File: ${file}\n\nContent:\n${content}\n\n`
      )).join('---\n\n');

      const analysisPrompt = `
        Analyze the following files from a GitHub repository:

        ${batchPrompt}

        For each file, provide a concise summary focusing on:
        1. What the code does
        2. Potential issues with best practices
        3. Performance concerns
        4. Security vulnerabilities

        Summarize your findings in a brief, structured format.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: 'You are a code review expert. Provide concise summaries of code issues.' },
          { role: 'user', content: analysisPrompt }
        ],
      });

      batchAnalyses.push(response.choices[0].message.content);

      // Update progress based on batches processed
      const progressPercentage = 60 + Math.floor(20 * (batchCounter / summaryBatches.length));
      await onProgress(progressPercentage);
    }

    console.log(`Completed batch analyses, generating final suggestions`);
    await onProgress(85);

    // Process batch analyses in overlapping chunks to avoid token limit
    const categorizeBatchAnalyses = async (analyses) => {
      // Apply sliding window to batch analyses as well
      const chunkSize = 5;
      const chunkOverlap = 1; // Overlap between analysis chunks
      const analysisChunks = [];

      for (let i = 0; i < analyses.length; i += (chunkSize - chunkOverlap)) {
        // Ensure we don't go beyond array bounds
        const end = Math.min(i + chunkSize, analyses.length);
        // Only create a chunk if we have at least one new analysis (not just overlap)
        if (i < analyses.length - chunkOverlap) {
          analysisChunks.push(analyses.slice(i, end));
        }
      }

      console.log(`Split ${analyses.length} analyses into ${analysisChunks.length} chunks with ${chunkOverlap} analysis overlap`);

      // Process each chunk and get intermediate categorized results
      const categoryResults = [];

      for (let i = 0; i < analysisChunks.length; i++) {
        console.log(`Processing analysis chunk ${i+1}/${analysisChunks.length}`);
        const chunk = analysisChunks[i];

        // Add context information about which part of the analysis this is
        const contextInfo = `This is chunk ${i+1} of ${analysisChunks.length} from the code analysis.`;

        // Add transition information for non-first chunks
        const transitionInfo = i > 0
          ? "Note: This chunk includes some overlap with the previous analysis to maintain context."
          : "";

        const chunkPrompt = `
          ${contextInfo}
          ${transitionInfo}

          Based on these code analyses:
          ${chunk.join('\n\n---\n\n')}

          Extract the key issues and categorize them into:
          1. Best Practices
          2. Performance
          3. Security

          Format as JSON:
          [
            {"category": "Best Practices", "suggestions": ["suggestion 1", "suggestion 2", ..., "suggestion n"]},
            {"category": "Performance", "suggestions": ["suggestion 1", "suggestion 2", ..., "suggestion n"]},
            {"category": "Security", "suggestions": ["suggestion 1", "suggestion 2", ..., "suggestion n"]}
          ]
        `;

        const chunkResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a code review expert. Extract key issues from code analyses and categorize them.' },
            { role: 'user', content: chunkPrompt }
          ],
        });

        try {
          // Extract JSON from response
          const responseText = chunkResponse.choices[0].message.content;
          const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            categoryResults.push(parsed);
          } else {
            // Fallback if JSON not found
            console.log('Could not extract proper JSON from chunk analysis, using text response');
            categoryResults.push([
              {
                category: 'Issues',
                suggestions: [responseText.substring(0, 500) + '...']
              }
            ]);
          }
        } catch (error) {
          console.error('Error parsing chunk analysis:', error);
          // Continue with next chunk
        }
      }

      return categoryResults;
    };

    // Get categorized analyses from all batches
    const categorizedAnalyses = await categorizeBatchAnalyses(batchAnalyses);

    // Merge all categorized results with deduplication
    const mergeResults = (categorizedChunks) => {
      const mergedCategories = {
        'Best Practices': new Set(),
        'Performance': new Set(),
        'Security': new Set()
      };

      // Collect all suggestions by category
      categorizedChunks.forEach(chunk => {
        chunk.forEach(item => {
          if (item.category in mergedCategories && Array.isArray(item.suggestions)) {
            item.suggestions.forEach(suggestion => {
              // Only add unique suggestions
              mergedCategories[item.category].add(suggestion);
            });
          }
        });
      });

      // Convert sets to arrays
      return Object.entries(mergedCategories).map(([category, suggestionsSet]) => ({
        category,
        suggestions: Array.from(suggestionsSet)
      }));
    };

    // Combine all results and filter to top suggestions
    let combinedResults = mergeResults(categorizedAnalyses);

    // Final pass to refine and prioritize suggestions using contextual sliding window
    // We need to split the combined results if they're too large
    // but maintain context between the splits
    const finalResultsProcessing = async (combinedResults) => {
      // If the combined results are small enough, process them directly
      if (JSON.stringify(combinedResults).length < 6000) {
        return await getFinalResults(combinedResults, structureAnalysis);
      }

      // Otherwise, process each category separately and then combine
      const processedCategories = [];

      for (const category of combinedResults) {
        // Process each category separately
        const categoryResult = await getFinalResults([category], structureAnalysis);
        processedCategories.push(...categoryResult);
      }

      return processedCategories;
    };

    // Helper function to get final results for a set of categorized issues
    const getFinalResults = async (categorizedIssues, structureOverview) => {
      const finalPrompt = `
        Based on this repository structure overview:
        ${structureOverview.substring(0, 1000)}

        And these categorized code issues:
        ${JSON.stringify(categorizedIssues, null, 2)}

        Create a final code review focusing on the most important issues.
        For each category present (Best Practices, Performance, Security),
        keep only the top 5-10 most significant suggestions.

        Format your response as a JSON array exactly like this:
        [
          {"category": "Best Practices", "suggestions": ["suggestion 1", "suggestion 2"]},
          {"category": "Performance", "suggestions": ["suggestion 1", "suggestion 2"]},
          {"category": "Security", "suggestions": ["suggestion 1", "suggestion 2"]}
        ]
      `;

      console.log(`Generating final prioritized analysis results`);
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a code review expert. Prioritize issues and format your response exactly as requested, as valid JSON.' },
          { role: 'user', content: finalPrompt }
        ],
      });

      // Extract and parse JSON from response
      const responseText = finalResponse.choices[0].message.content;
      const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);

      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Error parsing JSON from OpenAI response:', parseError);
          // Fallback to a simpler extraction approach
          const cleanedResponse = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

          try {
            return JSON.parse(cleanedResponse);
          } catch (fallbackError) {
            console.error('Fallback JSON parsing failed:', fallbackError);
            // Return the original categorized issues if parsing fails
            return categorizedIssues;
          }
        }
      } else {
        // If no JSON pattern found, use original results
        return categorizedIssues;
      }
    };

    // Process the final results with context awareness
    const parsedResults = await finalResultsProcessing(combinedResults);

    console.log(`Successfully parsed analysis results`);
    await onProgress(100);

    return {
      success: true,
      results: parsedResults
    };
  } catch (error) {
    console.error('Error in OpenAI analysis:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during analysis'
    };
  }
};

module.exports = {
  analyzeRepositoryWithOpenAI
};