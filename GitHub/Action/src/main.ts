import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import FormData from 'form-data';

/**
 * Makes a GET request to the specified URL using HTTP or HTTPS based on the protocol.
 * @param {string} apiUrl - The URL to fetch data from.
 * @returns {Promise<any>} - A promise that resolves to the parsed JSON response.
 */
function fetchData(apiUrl: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(apiUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    protocol.get(apiUrl, (res) => {
      let data = '';

      core.debug(`Response status code: ${res.statusCode}`);
      core.debug(`Response headers: ${JSON.stringify(res.headers)}`);

      // Collect response data chunks
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Resolve the promise when the response ends
      res.on('end', () => {
        try {
          resolve(JSON.parse(data)); // Parse JSON if applicable
        } catch (error) {
          resolve(data); // Return raw data if not JSON
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

/**
 * Uploads files to the specified controller endpoint.
 * @param {string} controllerUrl - The URL to send the files to.
 * @param {string[]} filePaths - Array of file paths to upload.
 * @returns {Promise<any>} - A promise that resolves to the server response.
 */
function uploadFiles(controllerUrl: string, filePaths: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(controllerUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const form = new FormData();

    // Append files to the form
    filePaths.forEach((filePath) => {
      form.append('files', fs.createReadStream(filePath), path.basename(filePath));
    });

    const requestOptions = {
      method: 'POST',
      headers: form.getHeaders(),
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
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(
              new Error(
                `Failed to upload files. Status: ${res.statusCode}, Response: ${responseData}`
              )
            );
          }
        });
      }
    );

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    // Pipe the form data into the request
    form.pipe(req);
  });
}

async function run(): Promise<void> {
  try {
    // Get the API URL from the action input
    const fileListApiUrl: string = core.getInput('api_url') + 'integration/file-list';
    const fileUploadApiUrl: string = core.getInput('api_url') + 'integration/scan-github-action';
    let response: any;

    try {
      response = await fetchData(fileListApiUrl);
      console.log('API Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }

    core.debug('Debug message');
    core.debug(`Api Response: ${response.fileList}`);

    // Fetch file types from the API
    const fileTypes: string[] = response.fileList;
    if (!Array.isArray(fileTypes)) {
      throw new Error("Invalid API response: 'fileList' should be an array.");
    }
    core.info(`File types retrieved: ${fileTypes.join(', ')}`);

    // Function to recursively find matching files
    const findFiles = (
      dir: string,
      filenames: string[],
      extensions: string[]
    ): string[] => {
      let result: string[] = [];
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip the node_modules directory
          if (file === 'node_modules') {
            continue;
          }
          // Recurse into subdirectories
          result = result.concat(findFiles(fullPath, filenames, extensions));
        } else if (filenames.includes(file) || extensions.includes(path.extname(file))) {
          // Add matching files
          result.push(fullPath);
        }
      }
      return result;
    };

    // Search the repository for matching files
    const repositoryRoot: string = process.env.GITHUB_WORKSPACE || '.';
    const matchedFiles: string[] = findFiles(repositoryRoot, fileTypes, []);

    // Output the matched files
    core.info(`Matched files: ${matchedFiles.join(', ')}`);
    core.setOutput('files', JSON.stringify(matchedFiles));

    // Send matched files to the controller
    const controllerResponse = await uploadFiles(fileUploadApiUrl, matchedFiles);
    core.info(`Controller Response: ${JSON.stringify(controllerResponse)}`);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

export { run };
