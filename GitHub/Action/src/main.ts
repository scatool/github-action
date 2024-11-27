import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

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

async function run(): Promise<void> {
  try {
    // Get the API URL from the action input
    const apiUrl: string = core.getInput('api_url');
    let response: any;

    try {
      response = await fetchData(apiUrl);
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
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

export { run };
