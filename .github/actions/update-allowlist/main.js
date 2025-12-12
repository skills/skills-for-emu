const fs = require("fs");

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
 * Parses multiple files and aggregates all action references
 * @param {Array<string>} filePaths - Array of file paths to parse
 * @returns {Array} Deduplicated array of action reference objects
 */
function parseMultipleFiles(filePaths) {
  const allResults = [];
  const seen = new Set();

  for (const filePath of filePaths) {
    try {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const references = parseActionReferences(fileContents);

      // Add to results, deduplicating across all files
      for (const ref of references) {
        if (!seen.has(ref.full)) {
          seen.add(ref.full);
          allResults.push(ref);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }

  return allResults;
}

module.exports = { parseActionReferences, parseMultipleFiles };
