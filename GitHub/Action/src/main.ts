import * as core from '@actions/core';
import uploadFiles from './upload_files';
import fetchFileList from './fetch_file_list';
import checkUpload from './check_upload';
import findFiles from './find_files';
import checkExpirationApiKey from './check_expiration_api_key';


async function run(): Promise<void> {
  try {
    // Get the API URL from the action input
    const fileListApiUrl: string = core.getInput('api_url') + 'integration/file-list';
    const fileUploadApiUrl: string = core.getInput('api_url') + 'integration/scan-github-action';
    
    //ensure that the node_modules folder is always excluded as this would lead to a large number of files being uploaded unwantedly
    const excludedPaths: string[] = core.getInput('excluded_paths').split(',').map((path) => path.trim());
    excludedPaths.push('node_modules/**');

    // Make sure the apiKey adhears to the apiKeyPattern and is not expired.
    checkExpirationApiKey(core.getInput('api_key'));

    // Fetch file types from the API
    let fileGroups: string[][] = await fetchFileList(fileListApiUrl).then((response) => response.files);
    
    // Check the API response
    if (!Array.isArray(fileGroups)) {
      throw new Error("Invalid API response: 'fileList' should be an array.");
    }

    // Get unique file types to easily search for the needed files
    let uniqueFileTypes = [...new Set(fileGroups.flat())]; 
    core.info(`File types retrieved: ${uniqueFileTypes.join(', ')}`);

    // Search the repository for matching files
    const repositoryRoot: string = process.env.GITHUB_WORKSPACE || '.';

    const foundFiles = await findFiles(repositoryRoot, uniqueFileTypes, excludedPaths.join(','));
    console.log('Found files, that will be uploaded:', foundFiles);

    // Check files before upload
    checkUpload(foundFiles, fileGroups);

    // Output the matched files
    core.setOutput('files', JSON.stringify(foundFiles));

    // Send matched files to the controller
    const controllerResponse = await uploadFiles(fileUploadApiUrl, foundFiles);
    core.info(`Controller Response: ${JSON.stringify(controllerResponse)}`);
  } catch (error) {
    core.setFailed(`Action failed with error: ${(error as Error).message}`);
    process.exit();
  }
}

export { run };
