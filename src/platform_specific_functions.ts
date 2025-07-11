import * as core from "@actions/core";
import * as github from "@actions/github";

function onFailure(msg: string): void {
  core.setFailed(msg);
  process.exit();
}

function onSuccess(msg: string, data: string): void {
  core.setOutput(msg, data);
  process.exit();
}

function onInfo(msg: string): void {
  core.info(msg);
}

function onWarning(msg: string): void {
  core.warning(msg);
}

function onDebug(msg: string): void {
  core.debug(msg);
}

function getRepositoryName(): string {
  return github.context.repo.owner + "/" + github.context.repo.repo;
}

function getRef(): string {
  return github.context.ref;
}

function getCommitHash(): string {
  return github.context.sha;
}

function getProjectId(): string {
  return core.getInput("project_id");
}

function getAPIKey(): string {
  return core.getInput("api_key");
}

function getAPIURL(): string {
  return core.getInput("api_url");
}

function getExcludedPaths(): string {
  return core.getInput("excluded_paths");
}

function getRepositoryRoot(): string {
  return process.env.GITHUB_WORKSPACE || ".";
}

export {
  onFailure,
  onSuccess,
  onInfo,
  onWarning,
  onDebug,
  getRepositoryName,
  getRef,
  getCommitHash,
  getProjectId,
  getAPIKey,
  getAPIURL,
  getExcludedPaths,
  getRepositoryRoot,
};
