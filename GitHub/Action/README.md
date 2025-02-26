# SCA Tool - GitHub Action
We are on a mission to make open-source software in products and projects safe, easy, and fun to use.

This is the GitHub-Action to interact with the SCA Tool API and start a scan of your repository automated with workflows.

## Getting Started

To get started visit [app.scatool.com](https://app.scatool.com) and create a new project and Distribution Unit. Additionally create an API-Key in your Organizartions Setting, subsection 'API Key'. The API-Key as well as the Distribution Unit Id are needed, in order to correctly identify, to which Distribuiton Unit a Upload is created.
For security reasons, we recommend adding the API-Key as a GitHub-Secret rather than writing your API-Key directly into the workflow, as it can lead to abuse if it is published.

If for some reason you publish your API-Key, you can invalidate the old one and create a new one on the same page, you created the old API-Key. Just make sure to Invalidate the correct one. Therefore use the name of the API-Key to identify the correct one.

For integrating the action in to your Worflow, you can copy below example. Just make sure to check out the repository before calling the SCA Tool Action.

## Action Documentation

The action performs the following steps:

1. **Get API URL and Excluded Paths**: Retrieves the API URL and excluded paths from the action inputs.
2. **Check API Key Expiration**: Ensures the API key is valid and not expired.
3. **Fetch File Types**: Fetches the list of file types from the API.
4. **Find Files**: Searches the repository for files matching the fetched file types, excluding specified paths.
5. **Check Upload**: Verifies that the necessary files are present and not oversized before uploading.
6. **Upload Files**: Sends the matched files to the controller.


## Exclusion List

The exclusion list should be files and paths relative to the baseDir of your repository.
- Example for folders: `node_modules/**`
- Example for file types: `Readme.md` or `*.kt`
- Example for a specific file in a subfolder: `test/package.json`

Add them to a String separated by a comma (",").

## Example of Workflow

```yaml
name: SCA Tool Scan
on: [push, pull_request]
jobs:
    scan:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout repository
                uses: actions/checkout@v2

            - name: Run SCA Tool Scan
                uses: scatool/sca-tool-action@v1
                with:
                    api_key: ${{ secrets.SCA_TOOL_API_KEY }}
                    distribution_id: 'aaaa-aaaa-aaaa-aaaa'
                    excluded_paths: 'node_modules/**, Readme.md, test/package.json'
```

## Parameters and Expected Values

- `api_url`: The base URL of the SCA Tool API.
- `api_key`: The API key for authenticating with the SCA Tool API.
- `excluded_paths`: Comma-separated list of paths to exclude from the scan.

## Internal-Publishing New Version of Action to GitHub

1. Update the version number in `action.yml`.
2. Commit and push the changes.
3. Create a new release on GitHub with the updated version number.
4. Tag the release with the version number (e.g., `v1.0.1`).


