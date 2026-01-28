/**
 * Repositories to exclude from analysis workflows
 */
const SKILLS_EXERCISE_REPOSITORY_IGNORE_LIST = [
  "skills/configure-codeql-language-matrix",
  "skills/connect-the-dots",
  "skills/deploy-to-azure",
  "skills/release-based-workflow",
  "skills/reusable-workflows",
  "skills/review-pull-requests",
  "skills/secure-code-game",
  "skills/change-commit-history"
];

/**
 * Parses file contents to extract GitHub Actions and reusable workflow references
 * @param {string} fileContents - The contents of a workflow file or markdown file
 * @returns {Array} Array of objects with {full, owner, repo, path, ref}
 */
function parseActionReferences(fileContents) {
  // Regex to match: uses: owner/repo[/path]@ref
  // Excludes local references starting with ./
  const regex =
    /uses:\s+([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(\/[a-zA-Z0-9-_.\/@]+)?@([a-zA-Z0-9.-]+)/g;

  const results = [];
  const seen = new Set();
  let match;

  while ((match = regex.exec(fileContents)) !== null) {
    const owner = match[1];
    const repo = match[2];
    const path = match[3] ? match[3].substring(1) : ""; // Remove leading /
    const ref = match[4];
    const full = `${owner}/${repo}${match[3] || ""}@${ref}`;

    // Deduplicate by full reference
    if (!seen.has(full)) {
      seen.add(full);
      results.push({
        full,
        owner,
        repo,
        path,
        ref,
      });
    }
  }

  return results;
}

/**
 * Finds all exercise repositories with the skills-course topic
 * @param {Object} github - GitHub SDK instance from github-script
 * @param {Array<string>} orgs - Array of organization names to search
 * @returns {Promise<Array<string>>} Array of repository full names (org/repo)
 */
async function findExerciseRepositories(github, orgs = ["skills"]) {
  const allRepos = [];

  for (const org of orgs) {
    try {
      const { data: repos } = await github.rest.search.repos({
        q: `org:${org} topic:skills-course archived:false fork:true`,
        per_page: 100,
      });

      console.log(`Found ${repos.items.length} repositories in ${org}`);
      allRepos.push(...repos.items.map((repo) => repo.full_name));
    } catch (error) {
      console.error(`Error searching repositories in ${org}:`, error.message);
      throw error;
    }
  }

  // Filter out ignored repositories
  return allRepos.filter((repo) => !SKILLS_EXERCISE_REPOSITORY_IGNORE_LIST.includes(repo));
}

/**
 * Gets all workflow and step files from a repository using Git Trees API
 * This uses only ONE API call instead of multiple recursive calls
 * @param {Object} github - GitHub SDK instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array<Object>>} Array of file objects with path and sha
 */
async function getWorkflowAndStepFiles(github, owner, repo) {
  try {
    // Get the default branch
    const { data: repoData } = await github.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // Get entire repository tree in ONE recursive API call
    const { data: tree } = await github.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: true,
    });

    // Filter for workflow and step files only
    const files = tree.tree
      .filter(item => 
        item.type === "blob" && 
        (item.path.startsWith(".github/workflows/") || 
         item.path.startsWith(".github/steps/"))
      )
      .map(item => ({ path: item.path, sha: item.sha }));

    return files;
  } catch (error) {
    if (error.status === 404) {
      console.log(`  Repository ${owner}/${repo} not found or tree unavailable (skipping)`);
      return [];
    }
    if (error.status === 409) {
      // Empty repository
      console.log(`  Repository ${owner}/${repo} is empty (skipping)`);
      return [];
    }
    console.error(`  Error fetching tree for ${owner}/${repo}:`, error.message);
    throw error;
  }
}

/**
 * Gets file content from a repository using Git Blob API
 * @param {Object} github - GitHub SDK instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} sha - File SHA from git tree
 * @param {string} path - File path (for logging only)
 * @returns {Promise<string>} File contents
 */
async function getFileContent(github, owner, repo, sha, path = '') {
  try {
    const { data } = await github.rest.git.getBlob({
      owner,
      repo,
      file_sha: sha,
    });

    // Blob content is base64 encoded
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (error) {
    if (error.status === 404) {
      console.error(`  File not found: ${path} (SHA: ${sha}) in ${owner}/${repo}`);
      return "";
    }
    console.error(`  Error reading file ${path} in ${owner}/${repo}:`, error.message);
    throw error;
  }
}

/**
 * Analyzes a single exercise repository for action references
 * @param {Object} github - GitHub SDK instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} Array of action reference objects
 */
async function analyzeExerciseRepository(github, owner, repo) {
  const allReferences = [];
  const seen = new Set();

  try {
    // Get all workflow and step files in ONE API call using Git Trees API
    const allFiles = await getWorkflowAndStepFiles(github, owner, repo);
    console.log(`  Found ${allFiles.length} workflow/step files`);

    if (allFiles.length === 0) {
      console.log(`  No workflow or step files found in ${owner}/${repo}`);
      return allReferences;
    }

    // Process each file
    for (const file of allFiles) {
      try {
        const content = await getFileContent(github, owner, repo, file.sha, file.path);
        if (!content) {
          console.log(`  Skipping empty file: ${file.path}`);
          continue;
        }

        const references = parseActionReferences(content);

        for (const ref of references) {
          if (!seen.has(ref.full)) {
            seen.add(ref.full);
            allReferences.push(ref);
          }
        }
      } catch (error) {
        console.error(`  Error processing file ${file.path}:`, error.message);
        // Continue processing other files
      }
    }

    console.log(`  Found ${allReferences.length} unique action references`);
  } catch (error) {
    console.error(`  Error analyzing repository ${owner}/${repo}:`, error.message);
    throw error;
  }

  return allReferences;
}

/**
 * Analyzes all exercise repositories and aggregates action references
 * @param {Object} github - GitHub SDK instance from github-script
 * @returns {Promise<Array>} Deduplicated array of all action references
 */
async function analyzeAllExercises(github) {
  const repos = await findExerciseRepositories(github);
  const allResults = [];
  const seen = new Set();
  const errors = [];
  let processedCount = 0;

  console.log(`\nAnalyzing ${repos.length} repositories...\n`);

  for (const repoFullName of repos) {
    const [owner, repo] = repoFullName.split("/");
    processedCount++;

    console.log(`[${processedCount}/${repos.length}] Analyzing ${repoFullName}...`);

    try {
      const references = await analyzeExerciseRepository(github, owner, repo);

      for (const ref of references) {
        if (!seen.has(ref.full)) {
          seen.add(ref.full);
          allResults.push(ref);
        }
      }
      
      console.log(`  ✓ Successfully analyzed ${repoFullName}`);
    } catch (error) {
      console.error(`  ✗ Failed to analyze ${repoFullName}:`, error.message);
      errors.push({ repo: repoFullName, error: error.message });
      // Continue with next repository
    }
  }

  console.log(`\n=== Analysis Complete ===`);
  console.log(`Repositories processed: ${processedCount}`);
  console.log(`Successful: ${processedCount - errors.length}`);
  console.log(`Failed: ${errors.length}`);
  console.log(`Total unique actions/workflows found: ${allResults.length}`);

  if (errors.length > 0) {
    console.log(`\nRepositories with errors:`);
    errors.forEach(({ repo, error }) => {
      console.log(`  - ${repo}: ${error}`);
    });
  }

  return allResults;
}

/**
 * Updates both strict and simple allowlists based on exercise repository analysis
 * @param {Object} github - GitHub SDK instance from github-script
 * @returns {Promise<Object>} Object with counts of entries written
 */
async function updateAllowlists(github) {
  const strictPath = process.env.STRICT_ALLOWLIST_PATH;
  const simplePath = process.env.SIMPLE_ALLOWLIST_PATH;
  
  if (!strictPath || !simplePath) {
    throw new Error('Environment variables STRICT_ALLOWLIST_PATH and SIMPLE_ALLOWLIST_PATH must be set');
  }
  
  // Get all action references
  const results = await analyzeAllExercises(github);
  
  // Sort results for consistent output
  results.sort((a, b) => a.full.localeCompare(b.full));
  
  // Generate strict allowlist (with specific versions)
  const strictEntries = results.map(ref => ref.full);
  
  // Generate simple allowlist (with wildcards, no specific versions)
  const simpleEntries = results.map(ref => {
    if (ref.path) {
      return `${ref.owner}/${ref.repo}/${ref.path}@*`;
    }
    return `${ref.owner}/${ref.repo}@*`;
  });
  
  // Remove duplicates from simple list (since we're using wildcards)
  const uniqueSimple = [...new Set(simpleEntries)].sort();
  
  // Write files with commas between entries, but not after the last one
  const fs = require('fs');
  fs.writeFileSync(strictPath, strictEntries.join(',\n') + '\n');
  fs.writeFileSync(simplePath, uniqueSimple.join(',\n') + '\n');
  
  console.log(`\n=== Allowlists Updated Successfully ===`);
  console.log(`Strict allowlist: ${strictEntries.length} entries written to ${strictPath}`);
  console.log(`Simple allowlist: ${uniqueSimple.length} entries written to ${simplePath}`);
  
  return {
    strict: strictEntries.length,
    simple: uniqueSimple.length
  };
}

module.exports = {
  updateAllowlists,
};
