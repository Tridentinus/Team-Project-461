import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// TODO: Add GitHub token as a secret on the repository. Then remove the default value.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummyToken';

if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required');
}

export { GITHUB_TOKEN };