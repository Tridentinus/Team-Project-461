import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required');
}

export { GITHUB_TOKEN };