import fg from "fast-glob";

/**
 * Recursively searches for specific file types in a folder, allowing exclusions.
 * @param baseDir The root directory to search in.
 * @param fileTypes Array of file extensions to include (e.g., ['.txt', '.js'])
 * @param excludePatterns A string containing paths and files to be excluded (similar to .gitignore)
 * @returns A list of matching files.
 */
async function findFiles(
  baseDir: string,
  fileTypes: string[],
  excludePatterns: string,
): Promise<string[]> {
  // Convert the .gitignore-like pattern string into an array of patterns
  const excludeRules = excludePatterns
    .split(",")
    .map((rule) => rule.trim().replace(/^\/+/, ""))
    .filter((rule) => rule && !rule.startsWith("#"))
    .filter((rule) => rule.length > 0); // Remove empty entries;

  // Generate file patterns to search for
  const filePatterns = fileTypes.map((ext) => `**/*${ext}`);

  // Use fast-glob to find matching files while excluding specified patterns
  const files = await fg(filePatterns, {
    cwd: baseDir,
    ignore: excludeRules,
    absolute: true,
    onlyFiles: true, // Ensures only files are returned (not directories)
  });

  return files.filter((file) => file.includes("node_modules") === false);
}

export default findFiles;
