import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SOURCE = 'https://gstcalc.github.io/data/ato-rates.json';

interface RatePayload {
  metadata?: unknown;
  gst?: unknown;
  individual?: unknown;
  company?: unknown;
  penalties?: unknown;
}

function assertValidPayload(payload: RatePayload) {
  if (!payload) {
    throw new Error('ATO rate payload was empty');
  }

  const requiredKeys: (keyof RatePayload)[] = ['metadata', 'gst', 'individual', 'company', 'penalties'];
  for (const key of requiredKeys) {
    if (!(key in payload)) {
      throw new Error(`ATO rate payload missing key: ${key}`);
    }
  }
}

async function ensureDirFor(filePath: string) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function writeJson(filePath: string, contents: unknown) {
  await ensureDirFor(filePath);
  await writeFile(filePath, `${JSON.stringify(contents, null, 2)}\n`, 'utf8');
}

async function loadExisting(filePath: string) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as RatePayload;
  } catch (error) {
    return undefined;
  }
}

async function main() {
  const source = process.env.ATO_RATES_SOURCE ?? DEFAULT_SOURCE;
  const repoRoot = process.cwd();
  const dataPath = path.resolve(repoRoot, 'data/ato-rates.json');
  const publicPath = path.resolve(repoRoot, 'public/data/ato-rates.json');

  const previous = await loadExisting(dataPath);

  console.log(`Fetching ATO rates from ${source}`);
  let payload: RatePayload | undefined;

  try {
    const response = await fetch(source, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to download rates from ${source}: ${response.status} ${response.statusText}`);
    }

    payload = (await response.json()) as RatePayload;
    assertValidPayload(payload);
  } catch (error) {
    if (previous) {
      console.warn(`Unable to reach remote source. Keeping existing rates. Reason: ${(error as Error).message}`);
      await writeJson(publicPath, previous);
      return;
    }
    throw error;
  }

  await writeJson(dataPath, payload);
  await writeJson(publicPath, payload);

  if (previous && JSON.stringify(previous) === JSON.stringify(payload)) {
    console.log('Rates unchanged – no updates required.');
  } else {
    console.log('ATO rates updated successfully.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
