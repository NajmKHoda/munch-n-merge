"use server";

import { neon } from '@neondatabase/serverless';

if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL environment variable is not set. Please add it to your .env file.');
}

export const sql = neon(process.env.NEON_DATABASE_URL);