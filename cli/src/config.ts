import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { CliConfig } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.lifesync');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const DATA_DIR = path.join(CONFIG_DIR, 'data');

export const DEFAULT_CONFIG: CliConfig = {
  apiUrl: 'http://localhost:3000',
  dataPath: DATA_DIR,
  defaultStore: '',
  defaultMealType: 'dinner',
  defaultCategory: 'other',
  username: 'user'
};

export async function ensureConfigExists(): Promise<void> {
  try {
    await fs.ensureDir(CONFIG_DIR);
    await fs.ensureDir(DATA_DIR);
    
    if (!(await fs.pathExists(CONFIG_FILE))) {
      await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
    }
  } catch (error) {
    console.error('Error creating config:', error);
  }
}

export async function loadConfig(): Promise<CliConfig> {
  try {
    await ensureConfigExists();
    const config = await fs.readJson(CONFIG_FILE);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: CliConfig): Promise<void> {
  try {
    await ensureConfigExists();
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

export async function updateConfig(updates: Partial<CliConfig>): Promise<void> {
  const config = await loadConfig();
  const newConfig = { ...config, ...updates };
  await saveConfig(newConfig);
}