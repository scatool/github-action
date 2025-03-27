import * as core from "@actions/core";
import * as github from "@actions/github";
import checkExpirationApiKey from "./check_expiration_api_key";
import checkUpload from "./check_upload";
import fetchFileList from "./fetch_file_list";
import findFiles from "./find_files";
import uploadFiles from "./upload_files";

async function run(): Promise<void> {
	try {
		// Get the API URL from the action input
		const fileListApiUrl: string = `${core.getInput("api_url")}integration/file-list`;
		const fileUploadApiUrl: string = `${core.getInput("api_url")}integration/scan-github-action`;

		//ensure that the node_modules folder is always excluded as this would lead to a large number of files being uploaded unwantedly
		const excludedPaths: string[] = core
			.getInput("excluded_paths")
			.split(",")
			.map((path) => path.trim());
		excludedPaths.push("node_modules/**");

		// Make sure the apiKey adhears to the apiKeyPattern and is not expired.
		checkExpirationApiKey(core.getInput("api_key"));

		// Fetch file types from the API
		const fileGroups: string[][] = await fetchFileList(fileListApiUrl).then(
			(response) => response.files,
		);

		// Check the API response
		if (!Array.isArray(fileGroups)) {
			throw new Error("Invalid API response: 'fileList' should be an array.");
		}

		// Get unique file types to easily search for the needed files
		const uniqueFileTypes = [...new Set(fileGroups.flat())];
		core.info(`File types retrieved: ${uniqueFileTypes.join(", ")}`);

		// Search the repository for matching files
		const repositoryRoot: string = process.env.GITHUB_WORKSPACE || ".";

		const foundFiles = await findFiles(
			repositoryRoot,
			uniqueFileTypes,
			excludedPaths.join(","),
		);
		console.log("Found files, that will be uploaded:", foundFiles);

		// Check files before upload
		checkUpload(foundFiles, fileGroups);

		// Output the matched files
		core.setOutput("files", JSON.stringify(foundFiles));

		// Send matched files to the controller
		const controllerResponse = await uploadFiles(fileUploadApiUrl, foundFiles);

		// If the GITHUB_TOKEN is set and we the action was triggered inside an PullRequest, try to create a comment with the url to scatool
		const githubToken = core.getInput("github_token");
		if ( githubToken != "" && github.context.payload.pull_request != null ) {
			// TODO: Adjust the url when needed
			const octokit = github.getOctokit(githubToken);
			const prNumber = github.context.payload.pull_request.number;
			const repo = github.context.repo;
			const comment = `The files have been uploaded to the SCATool. You can find the results [here](https://scatool.sca.com/scan/${controllerResponse}).`;
			await octokit.rest.issues.createComment({
				...repo,
				issue_number: prNumber,
				body: comment,
			});
		}

		core.info(`Controller Response: ${JSON.stringify(controllerResponse)}`);
	} catch (error) {
		core.setFailed(`Action failed with error: ${(error as Error).message}`);
		process.exit();
	}
}

export { run };
