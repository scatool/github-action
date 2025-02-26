import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as core from "@actions/core";

/**
 * Makes a GET request to the specified URL using HTTP or HTTPS based on the protocol.
 * @param {string} apiUrl - The URL to fetch data from.
 * @returns {Promise<any>} - A promise that resolves to the parsed JSON response.
 */
function fetchFileList(apiUrl: string): Promise<any> {
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
						resolve(JSON.parse(data)); // Parse JSON if applicable
					} catch (error) {
						resolve(data); // Return raw data if not JSON
					}
				});
			})
			.on("error", (error) => {
				reject(new Error(`Request failed: ${error.message}`));
			})
			// Abort the request if it takes longer than 10 seconds
			.setTimeout(10000, () => {
				core.setFailed("Connection with Server failed. Please try again later.");
				process.exit();
			});
	});
}

export default fetchFileList;
