import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import uploadFiles from './upload_files';
import fetchFileList from './fetch_file_list';
import checkUpload from './check_upload';
import findFiles from './find_files';


const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

async function run(): Promise<void> {
  try {
    // Get the API URL from the action input
    const fileListApiUrl: string = core.getInput('api_url') + 'integration/file-list';
    const fileUploadApiUrl: string = core.getInput('api_url') + 'integration/scan-github-action';
    let response: any;

    const excludedPaths: string[] = core.getInput('excluded_paths').split(',').map((path) => path.trim());
    excludedPaths.push('node_modules');

    
    response = await fetchFileList(fileListApiUrl);
    console.log('API Response:', response);
    
    // Fetch file types from the API
    const fileTypes: string[][] = response.files;
    console.log('Test', response.files);
    if (!Array.isArray(fileTypes)) {
      throw new Error("Invalid API response: 'fileList' should be an array.");
    }
    let filepairs = fileTypes;
    filepairs.forEach((pair) => {
      console.log('Pair:', pair);
      if (pair.length < 2) {
        throw new Error("Invalid API response: Each 'fileList' item should be an array of two strings.");
      }
    });

    let uniqueFileTypes = [...new Set(filepairs.flat())];
    
    core.info(`File types retrieved: ${uniqueFileTypes.join(', ')}`);

    // Function to recursively find matching files
    const findsFiles = (
      dir: string,
      filenames: string[],
      extensions: string[], 
      excludedPaths: string[] = []
    ): string[] => {
      let result: string[] = [];
      const files = fs.readdirSync(dir);
    
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
    
        // Skip excluded paths
        if (excludedPaths.includes(fullPath)) {
          continue;
        }
    
        if (stat.isDirectory()) {
          // Recurse into subdirectories
          result = result.concat(findsFiles(fullPath, filenames, extensions, excludedPaths));
        } else if (filenames.includes(file) || extensions.includes(path.extname(file))) {
          // Check file size
          if (stat.size <= MAX_FILE_SIZE) {
            // Add matching files
            result.push(fullPath);
          } else {
            core.setFailed(`File ${fullPath} is larger than 100 MB. Please split it up or exclude it in order to get the action working.`);
          }
        }
      }
      return result;
    };

    // Search the repository for matching files
    const repositoryRoot: string = process.env.GITHUB_WORKSPACE || '.';
    const matchedFiles: string[] = findsFiles(repositoryRoot, uniqueFileTypes, [], excludedPaths);

    const newMethodFiles = await findFiles(repositoryRoot, uniqueFileTypes, excludedPaths.join(','));
    console.log('New Method Files:', newMethodFiles);

    // Check files before upload
    checkUpload(matchedFiles, filepairs);


    // Output the matched files
    core.info(`Matched files: ${matchedFiles.join(', ')}`);
    core.setOutput('files', JSON.stringify(matchedFiles));

    // Send matched files to the controller
    const controllerResponse = await uploadFiles(fileUploadApiUrl, matchedFiles);
    core.info(`Controller Response: ${JSON.stringify(controllerResponse)}`);
  } catch (error) {
    core.setFailed(`Action failed with error: ${(error as Error).message}`);
    process.exit();
  }
}

export { run };
