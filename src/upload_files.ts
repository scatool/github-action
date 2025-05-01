import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import * as url from "node:url";
import * as core from "@actions/core";
import * as github from "@actions/github";
import FormData from "form-data";

/**
 * Uploads files to the specified controller endpoint.
 * @param {string} controllerUrl - The URL to send the files to.
 * @param {string[]} filePaths - Array of file paths to upload.
 * @returns {Promise<any>} - A promise that resolves to the server response.
 */
function uploadFiles(
  controllerUrl: string,
  filePaths: string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(controllerUrl);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const form = new FormData();

    // Append files to the form
    for (const filePath of filePaths) {
      form.append(
        "files",
        fs.createReadStream(filePath),
        path.basename(filePath),
      );
      form.append(
        "paths",
        path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
      );
    }

    form.append(
      "repositoryName",
      github.context.repo.owner + "/" + github.context.repo.repo,
    );
    form.append("branchName", github.context.ref);
    form.append("commitHash", github.context.sha);
    form.append("runNumber", process.env.GITHUB_RUN_ATTEMPT);
    form.append("projectId", core.getInput("project_id"));
    form.append("apiKey", core.getInput("api_key"));

    const requestOptions = {
      method: "POST",
      headers: {
        ...form.getHeaders(),
        "API-Key": core.getInput("api_key"),
      },
    };

    const newUrl = new URL(controllerUrl);
    const req = protocol.request(
      {
        hostname: newUrl.hostname,
        port: newUrl.port || 443,
        path: newUrl.pathname,
        method: requestOptions.method,
        headers: requestOptions.headers,
      },
      (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(
              new Error(
                `Failed to upload files. Status: ${res.statusCode}, Response: ${responseData}, res: ${res.statusMessage}`,
              ),
            );
          }
        });
      },
    );

    req.on("error", (error) => {
      reject(new Error(`Upload failed - Request error: ${error.message}`));
    });

    // Pipe the form data into the request
    form.pipe(req);
  });
}

export default uploadFiles;
