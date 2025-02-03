import * as core from '@actions/core';

/**A typescript funtion that gets a filelist and a list of list of filetypes. 
* It should check if at least one file is availbale to be uploaded and if the combinations of at least on filetype list is completly represented in the files. 
* If not it should let the action fail and inform the user what files are searched for.
* This is important to prevent uploads that cant work because of missing files.
* @param {string[]} fileList - The list of files to be uploaded.
* @param {string[][]} fileTypes - The list of file types to be uploaded.
* @returns {void} - No return value.
*/

function checkUpload(fileList: string[], fileTypes: string[][]): void {
  // Check if the file list is empty
  if (fileList.length === 0) {
    core.setFailed('No files found to upload.');
    process.exit();
  }

  // Check if the file types list is empty
  if (fileTypes.length === 0) {
    core.setFailed('Internal Error. Please check for update of action or contact us.');
    process.exit();
  }

  // Check if no file is larger than the maximum file size
  const maxFileSize = 100 * 1024 * 1024; // 100 MB in bytes
  const oversizedFiles = fileList.filter(file => require('fs').statSync(file).size > maxFileSize);
  if (oversizedFiles.length > 0) {
    core.setFailed(`The following files are larger than the maximum file size of ${maxFileSize} bytes: ${oversizedFiles.join(", ")}`);
    process.exit();
  }

  // Check if the combinations of at least one filetype list is completely represented in the files
  let check_passed = fileTypes.some((fileTypeCombi) => 
    fileTypeCombi.every((fileType) => 
        fileList.some((file) => file.endsWith(fileType))
    )
  );

    if (!check_passed) {
        core.setFailed(`Not all necessary files are presen in the selected scope. Please ensure at least one combination of following types is included in the configured paths: \n${fileTypes.map(pair => `[ ${pair.join(", ")} ]`).join("\n")}`);
        process.exit();
    }

  core.info('All checks passed.');
}

export default checkUpload;