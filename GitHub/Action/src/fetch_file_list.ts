import * as http from "node:http";
import * as https from "node:https";
import * as url from "node:url";
import * as core from "@actions/core";

interface FileListResponse {
	files: string[][];
}

/**
 * Makes a GET request to the specified URL using HTTP or HTTPS based on the protocol.
 * @param {string} apiUrl - The URL to fetch data from.
 * @returns {Promise<FileListResponse>} - A promise that resolves to the parsed JSON response.
 */
function fetchFileList(apiUrl: string): Promise<FileListResponse> {
	return new Promise((resolve, reject) => {
		const parsedUrl = url.parse(apiUrl);
		const protocol = parsedUrl.protocol === "https:" ? https : http;

		protocol
			.get(apiUrl, (res) => {
				let data = "";

				core.debug(`Response status code: ${res.statusCode}`);
				core.debug(`Response headers: ${JSON.stringify(res.headers)}`);

				// Collect response data chunks
				res.on("data", (chunk) => {
					data += chunk;
				});

				// Resolve the promise when the response ends
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(data);
						resolve(parsedData as FileListResponse); // Parse JSON if applicable
					} catch (error) {
						reject(new Error("Failed to parse JSON response"));
					}
				});
			})
			.on("error", (error) => {
				reject(new Error(`Request failed: ${error.message}`));
			})
			// Abort the request if it takes longer than 10 seconds
			.setTimeout(10000, () => {
				core.setFailed(
					"Connection with Server failed. Please try again later.",
				);
				process.exit();
			});
	});
}

export default fetchFileList;
