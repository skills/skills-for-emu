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
    const { data: repos } = await github.rest.search.repos({
      q: `org:${org} topic:skills-course archived:false`,
      per_page: 100,
    });

    allRepos.push(...repos.items.map((repo) => repo.full_name));
  }

  return allRepos;
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
      return fileList;
    }
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
  const { data } = await github.rest.repos.getContent({
    owner,
    repo,
    path,
    mediaType: {
      format: "raw", // Gets raw content instead of base64
    },
  });

  return data;
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

  for (const repoFullName of repos) {
    const [owner, repo] = repoFullName.split("/");

    console.log(`Analyzing ${repoFullName}...`);

    const references = await analyzeExerciseRepository(github, owner, repo);

    for (const ref of references) {
      if (!seen.has(ref.full)) {
        seen.add(ref.full);
        allResults.push(ref);
      }
    }
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
