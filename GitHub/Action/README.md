# SCA Tool - GitHub Action
We are on a mission to make open-source software in products and projects safe, easy, and fun to use.

This is the GitHub-Action to interact with the SCA Tool API and start a scan of your repository automated with workflows.

To get started visist <a href = "https://app.scatool.com">app.scatool.com</a> and create a new project and Distribution Unit. With that you will receive a API-Key that you need to add to your Repository. For ssecurity reasons we recommend to add them as a GitHub-Secret than to write your API-Key directly into the workflow, as it can lead to abuse if it is published.

Exlusion list should be files and paths and be relativce to the baseDir of your repository.
Example for folders: node_modules/**
Example for filetypes: Readme.md
Example for specific file in subfolder: test/package.json
Add them to a String seperated by a comma (",")

## Example of workflow


## Parameters and expected values


## Internal-Publishing new Version of Action to GitHub