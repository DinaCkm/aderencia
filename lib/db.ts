import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readJson<T>(name: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    return defaultValue;
  }
}

export function writeJson<T>(name: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
