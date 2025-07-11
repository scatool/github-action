import * as ps from "./platform_specific_functions";

function checkExpirationApiKey(apiKey: string): null {
  if (!apiKey) {
    ps.onFailure(
      "No API key provided. Please set the api_key input in your workflow and repository secrets.",
    );
  }

  const apiKeyPattern = /^sca(\d{4}-\d{2}-\d{2})tool([a-zA-Z0-9_-]+)$/;
  const match = apiKey.match(apiKeyPattern);

  if (!match) {
    ps.onFailure(
      "Invalid API key format. Check your apiKey or create a new one.",
    );
    return null;
  }

  const expirationDateStr = match[1]; // Extract the date part
  const expirationDate = new Date(expirationDateStr);
  const today = new Date();

  // Remove time part from today's date to ensure accurate comparison
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  if (expirationDate < today) {
    ps.onFailure(
      "The API key provided has expired. Please create a new one in the organization settings. After creating a new one, make sure to update the API key in the GitHub Secrets.",
    );
  }

  // Check if expiration date is within the next 30 days
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setDate(today.getDate() + 30);

  if (expirationDate <= oneMonthFromNow) {
    console.warn(
      `Warning: API key will expire soon on ${expirationDateStr}. Consider renewing it to make sure your integration keeps running.`,
    );
  }

  ps.onInfo("API key is still valid.");
  return null;
}

export default checkExpirationApiKey;
