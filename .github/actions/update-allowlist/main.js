/**
 * Repositories to exclude from analysis workflows
 */
const SKILLS_EXERCISE_REPOSITORY_IGNORE_LIST = [
  "skills/code-with-codespaces",
  "skills/communicate-using-markdown",
  "skills/configure-codeql-language-matrix",
  "skills/connect-the-dots",
  "skills/deploy-to-azure",
  "skills/github-pages",
  "skills/hello-github-actions",
  "skills/introduction-to-codeql",
  "skills/introduction-to-github",
  "skills/introduction-to-secret-scanning",
  "skills/publish-packages",
  "skills/release-based-workflow",
  "skills/resolve-merge-conflicts",
  "skills/reusable-workflows",
  "skills/review-pull-requests",
  "skills/secure-code-game",
  "skills/secure-repository-supply-chain",
  "skills/test-with-actions",
  "skills/write-javascript-actions",
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
async function findExerciseRepositories(github, orgs = ["skills", "skills-dev"]) {
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
 * Recursively gets all files from a directory in a repository
 * @param {Object} github - GitHub SDK instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Directory path
 * @param {Array<Object>} fileList - Accumulated list of file objects
 * @returns {Promise<Array<Object>>} Array of file objects with path and sha
 */
async function getFilesFromDirectory(github, owner, repo, path, fileList = []) {
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    // If it's an array, it's a directory listing
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.type === "file") {
          fileList.push({ path: item.path, sha: item.sha });
        } else if (item.type === "dir") {
          await getFilesFromDirectory(github, owner, repo, item.path, fileList);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist, return what we have
    if (error.status === 404) {
      console.log(`  Directory ${path} not found in ${owner}/${repo} (skipping)`);
      return fileList;
    }
    console.error(`  Error accessing ${path} in ${owner}/${repo}:`, error.message);
    throw error;
  }

  return fileList;
}

/**
 * Gets file content from a repository
 * @param {Object} github - GitHub SDK instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @returns {Promise<string>} File contents
 */
async function getFileContent(github, owner, repo, path) {
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path,
      mediaType: {
        format: "raw", // Gets raw content instead of base64
      },
    });

    return data;
  } catch (error) {
    if (error.status === 404) {
      console.error(`  File not found: ${path} in ${owner}/${repo}`);
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

  // Get all files from .github/workflows
  const workflowFiles = await getFilesFromDirectory(github, owner, repo, ".github/workflows");

  // Get all files from .github/steps
  const stepFiles = await getFilesFromDirectory(github, owner, repo, ".github/steps");

  const allFiles = [...workflowFiles, ...stepFiles];

  // Process each file
  for (const file of allFiles) {
    const content = await getFileContent(github, owner, repo, file.path);
    const references = parseActionReferences(content);

    for (const ref of references) {
      if (!seen.has(ref.full)) {
        seen.add(ref.full);
        allReferences.push(ref);
      }
    }
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

module.exports = {
  parseActionReferences,
  findExerciseRepositories,
  getFilesFromDirectory,
  getFileContent,
  analyzeExerciseRepository,
  analyzeAllExercises,
};

// Debug execution - only runs when file is executed directly
if (require.main === module) {
  (async () => {
    console.log("Debug mode: Running analyzeAllExercises...");
    
    // Mock GitHub SDK for debugging
    // Replace this with actual GitHub token if needed: process.env.GITHUB_TOKEN
    const { Octokit } = require("@octokit/rest");
    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
    });

    try {
      const results = await analyzeAllExercises(github);
      console.log("\nResults:");
      console.log(JSON.stringify(results, null, 2));
      console.log(`\nTotal unique actions found: ${results.length}`);
    } catch (error) {
      console.error("Error during analysis:", error);
      process.exit(1);
    }
  })();
}
