/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, jest } from "@jest/globals";
import * as main from "../src/main";

// Mock the action's entrypoint
const runMock = jest
  .spyOn(main, "run")
  .mockImplementation(() => Promise.resolve());

describe("index", () => {
  it("calls run when imported", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../src/index");

    expect(runMock).toHaveBeenCalled();
  });
});
