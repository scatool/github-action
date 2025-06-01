import * as core from "@actions/core";
import * as github from "@actions/github";

/**
 * Recursively searches for specific file types in a folder, allowing exclusions.
 * @param message The message that should be posted as a comment.
 * @param fileTypes Array of file extensions to include (e.g., ['.txt', '.js'])
 * @returns null
 */
async function postComment(
  message: string,
  foundFiles: string[],
): Promise<null> {
  // If the GITHUB_TOKEN is set and we the action was triggered inside an PullRequest, try to create a comment with the url to scatool
  const githubToken = core.getInput("github_token");
  if (githubToken != "" && github.context.payload.pull_request != null) {
    // TODO: Adjust the url when needed
    const octokit = github.getOctokit(githubToken);
    const prNumber = github.context.payload.pull_request.number;
    const repo = github.context.repo;
    const details = foundFiles.map((file) => `- ${file}`).join("\n");
    const comment = `${message}\n<details>
          <summary>Uploaded Files</summary>
          ${details}
        </details>`;
    await octokit.rest.issues.createComment({
      ...repo,
      issue_number: prNumber,
      body: comment,
    });
  }

  return null;
}

export default postComment;
