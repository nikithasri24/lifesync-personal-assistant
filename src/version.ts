// Auto-generated version file
// This file is automatically updated by the version management system

export const VERSION = '1.0.0';
export const BUILD_DATE = '2025-09-05T18:02:50.268Z';
export const COMMIT_SHA = 'unknown';
export const COMMIT_SHORT_SHA = 'unknown';
export const BRANCH = 'unknown';
export const LAST_TAG = 'none';
export const COMMITS_SINCE_TAG = 0;

export const VERSION_INFO = {
  version: VERSION,
  buildDate: BUILD_DATE,
  commit: {
    sha: COMMIT_SHA,
    shortSha: COMMIT_SHORT_SHA,
    branch: BRANCH
  },
  release: {
    lastTag: LAST_TAG,
    commitsSinceTag: COMMITS_SINCE_TAG
  }
} as const;

// Helper function to get full version string
export function getFullVersion(): string {
  const base = VERSION;
  const commits = COMMITS_SINCE_TAG > 0 ? `+${COMMITS_SINCE_TAG}` : '';
  const sha = `(${COMMIT_SHORT_SHA})`;
  const branch = BRANCH !== 'main' ? `[${BRANCH}]` : '';
  
  return `${base}${commits}${sha}${branch}`;
}

// Helper function to check if this is a development build
export function isDevelopmentBuild(): boolean {
  return COMMITS_SINCE_TAG > 0 || BRANCH !== 'main';
}
