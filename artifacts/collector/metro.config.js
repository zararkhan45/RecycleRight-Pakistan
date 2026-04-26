const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

// This repo uses pnpm workspaces, which installs dependencies as symlinks.
// Metro needs explicit node_modules paths + symlink support to resolve
// packages reliably (especially when bundling for Expo Go on device).
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..", "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver = {
  ...config.resolver,
  // Look for deps in app + workspace root.
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  // Needed for pnpm symlinked node_modules.
  unstable_enableSymlinks: true,
};

module.exports = config;
