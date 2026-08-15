import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';

export type StorageCategory = 'logos' | 'signatures' | 'certificates' | 'tmp';

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function resolvePath(category: StorageCategory, ...segments: string[]): string {
  return path.join(env.STORAGE_DIR, category, ...segments);
}

export async function saveFile(category: StorageCategory, relativePath: string, data: Buffer): Promise<string> {
  const absolutePath = resolvePath(category, relativePath);
  await ensureDir(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, data);
  return absolutePath;
}

export async function readFile(category: StorageCategory, relativePath: string): Promise<Buffer> {
  return fs.readFile(resolvePath(category, relativePath));
}

export async function deleteFile(category: StorageCategory, relativePath: string): Promise<void> {
  await fs.rm(resolvePath(category, relativePath), { force: true });
}

export async function fileExists(category: StorageCategory, relativePath: string): Promise<boolean> {
  try {
    await fs.access(resolvePath(category, relativePath));
    return true;
  } catch {
    return false;
  }
}
