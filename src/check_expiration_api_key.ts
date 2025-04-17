import * as core from "@actions/core";

function checkExpirationApiKey(apiKey: string): null {
  if (!apiKey) {
    core.setFailed(
      "No API key provided. Please set the api_key input in your workflow and repository secrets.",
    );
    process.exit();
  }

  const apiKeyPattern = /^sca(\d{4}-\d{2}-\d{2})tool([a-zA-Z0-9_-]+)$/;
  const match = apiKey.match(apiKeyPattern);

  if (!match) {
    core.setFailed(
      "Invalid API key format. Check your apiKey or create a new one.",
    );
    process.exit();
  }

  const expirationDateStr = match[1]; // Extract the date part
  const expirationDate = new Date(expirationDateStr);
  const today = new Date();

  // Remove time part from today's date to ensure accurate comparison
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  if (expirationDate < today) {
    core.setFailed(
      "The API key provided has expired. Please create a new one in the organization settings. After creating a new one, make sure to update the API key in the GitHub Secrets.",
    );
    process.exit();
  }

  // Check if expiration date is within the next 30 days
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setDate(today.getDate() + 30);

  if (expirationDate <= oneMonthFromNow) {
    console.warn(
      `Warning: API key will expire soon on ${expirationDateStr}. Consider renewing it to make sure your integration keeps running.`,
    );
  }

  core.info("API key is still valid.");
  return null;
}

export default checkExpirationApiKey;
