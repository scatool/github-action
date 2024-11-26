const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');


/**
 * Makes a GET request to the specified URL using HTTP or HTTPS based on the protocol.
 * @param {string} apiUrl - The URL to fetch data from.
 * @returns {Promise<any>} - A promise that resolves to the parsed JSON response.
 */
function fetchData(apiUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(apiUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;


    protocol.get(apiUrl, (res) => {
      let data = '';

      core.debug(`Response status code: ${res.statusCode}`);
      core.debug(`Response headers: ${JSON.stringify(res.headers)}`);
      core.debug(`Response data: ${res.FileList}`);

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

async function run() {
  try {
    // Get the API URL from the action input
    const apiUrl = core.getInput('api_url');
    var response = null;
    try {
        response = await fetchData(apiUrl);
        console.log('API Response:', response);
      } catch (error) {
        console.error('Error:', error.message);
      }
    core.debug("Debug message")
    core.debug('Api Response:', response.fileList);

    // Fetch file types from the API
    //const response = await axios.get(apiUrl);
    const fileTypes = response.fileList;
    if (!Array.isArray(fileTypes)) {
      throw new Error("Invalid API response: 'filetypes' should be an array.");
    }
    core.info(`File types retrieved: ${fileTypes.join(', ')}`);

    //Till here it works

    // Function to recursively find matching files
    const findFiles = (dir, filenames, extensions) => {
      let result = [];
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
    const repositoryRoot = process.env.GITHUB_WORKSPACE || '.';
    const matchedFiles = findFiles(repositoryRoot, fileTypes, []);

    // Output the matched files
    core.info(`Matched files: ${matchedFiles.join(', ')}`);
    core.setOutput('files', JSON.stringify(matchedFiles));
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports = {
  run
}
