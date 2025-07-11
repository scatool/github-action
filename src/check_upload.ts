import * as ps from "./platform_specific_functions";

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
    ps.onFailure("No files found to upload.");
  }

  // Check if the file types list is empty
  if (fileTypes.length === 0) {
    ps.onFailure(
      "Internal Error. Please check for update of action or contact us.",
    );
  }

  // Check if no file is larger than the maximum file size
  const maxFileSize = 100 * 1024 * 1024; // 100 MB in bytes
  const oversizedFiles = fileList.filter(
    (file) => require("node:fs").statSync(file).size > maxFileSize,
  );
  if (oversizedFiles.length > 0) {
    ps.onFailure(
      `The following files are larger than the maximum file size of ${maxFileSize} bytes: ${oversizedFiles.join(", ")}`,
    );
  }

  // Check if the combinations of at least one filetype list is completely represented in the files
  const check_passed = fileTypes.some((fileTypeCombi) =>
    fileTypeCombi.every((fileType) =>
      fileList.some((file) => file.endsWith(fileType)),
    ),
  );

  if (!check_passed) {
    ps.onFailure(
      `Not all necessary files are presen in the selected scope. Please ensure at least one combination of following types is included in the configured paths: \n${fileTypes.map((pair) => `[ ${pair.join(", ")} ]`).join("\n")}`,
    );
  }

  ps.onInfo("All checks passed.");
}

export default checkUpload;
