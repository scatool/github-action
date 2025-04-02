import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import checkExpirationApiKey from "../src/check_expiration_api_key";
import * as core from "@actions/core";

jest.mock("@actions/core", () => ({
  setFailed: jest.fn(),
  info: jest.fn(),
}));

describe("checkExpirationApiKey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fail if API key format is invalid", () => {
    expect(() => checkExpirationApiKey("invalid-key")).toThrow(
      "process.exit called",
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      "Invalid API key format. Check your apiKey or create a new one.",
    );
  });

  it("should fail if API key is expired", () => {
    const expiredKey = "sca2023-01-01toolXYZ";
    expect(() => checkExpirationApiKey(expiredKey)).toThrow(
      "process.exit called",
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      "The API key provided has expired. Please create a new one in the organization settings. After creating a new one, make sure to update the API key in the GitHub Secrets.",
    );
  });

  it("should warn if API key expires in less than 30 days", () => {
    const today = new Date();
    today.setDate(today.getDate() + 10); // 10 days from today
    const soonToExpireKey = `sca${today.toISOString().split("T")[0]}toolXYZ`;

    console.warn = jest.fn();
    checkExpirationApiKey(soonToExpireKey);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Warning: API key will expire soon"),
    );
  });

  it("should pass if API key is valid and not expiring soon", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from today
    const validKey = `sca${futureDate.toISOString().split("T")[0]}toolXYZ`;

    checkExpirationApiKey(validKey);
    expect(core.info).toHaveBeenCalledWith("API key is still valid.");
  });
});
