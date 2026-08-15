import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('cf_token'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  STORAGE_DIR: z.string().default('storage'),
  PUBLIC_VERIFY_BASE_URL: z.string().url().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

const parsedEnv = loadEnv();

export const env = {
  ...parsedEnv,
  STORAGE_DIR: path.isAbsolute(parsedEnv.STORAGE_DIR)
    ? parsedEnv.STORAGE_DIR
    : path.resolve(process.cwd(), parsedEnv.STORAGE_DIR),
  PUBLIC_VERIFY_BASE_URL: parsedEnv.PUBLIC_VERIFY_BASE_URL ?? parsedEnv.CLIENT_URL,
};
