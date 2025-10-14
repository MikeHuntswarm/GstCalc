import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PRIMARY_SOURCE = 'https://gstcalc.github.io/data/ato-rates.json';
const RAW_GITHUB_FALLBACK =
  'https://raw.githubusercontent.com/GstCalc/GstCalc/main/data/ato-rates.json';
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.ATO_RATES_TIMEOUT ?? '15000', 10);
const ACCESS_TOKEN = process.env.ATO_RATES_ACCESS_TOKEN ?? process.env.GITHUB_TOKEN;
const USER_AGENT = process.env.ATO_RATES_USER_AGENT ?? 'GSTCalcRatesUpdater/1.0';

interface RatePayload {
  metadata?: unknown;
  gst?: unknown;
  individual?: unknown;
  company?: unknown;
  penalties?: unknown;
  lodgements?: unknown;
  taxPlanning?: unknown;
}

function assertValidPayload(payload: RatePayload) {
  if (!payload) {
    throw new Error('ATO rate payload was empty');
  }

  const requiredKeys: (keyof RatePayload)[] = [
    'metadata',
    'gst',
    'individual',
    'company',
    'penalties',
    'lodgements',
    'taxPlanning',
  ];
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

function resolveHeaders(url: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  };

  let hostname: string | undefined;
  try {
    hostname = new URL(url).hostname;
  } catch (error) {
    hostname = undefined;
  }

  if (
    ACCESS_TOKEN &&
    hostname &&
    (hostname.includes('githubusercontent.com') || hostname.includes('github.com'))
  ) {
    headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  return headers;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: resolveHeaders(url),
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('name' in error) {
    return (error as { name?: string }).name === 'AbortError';
  }

  return false;
}

function resolveSources() {
  const envSource = process.env.ATO_RATES_SOURCE;
  if (envSource) {
    return [envSource];
  }

  return [PRIMARY_SOURCE, RAW_GITHUB_FALLBACK];
}

async function tryFetch(url: string) {
  console.log(`Attempting to download ATO rates from ${url}`);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download rates from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as RatePayload;
  assertValidPayload(payload);
  return payload;
}

async function main() {
  const sources = resolveSources();
  const repoRoot = process.cwd();
  const dataPath = path.resolve(repoRoot, 'data/ato-rates.json');
  const publicPath = path.resolve(repoRoot, 'public/data/ato-rates.json');

  const previous = await loadExisting(dataPath);

  let payload: RatePayload | undefined;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      payload = await tryFetch(source);
      break;
    } catch (error) {
      if (isAbortError(error)) {
        errors.push(`Timed out after ${FETCH_TIMEOUT_MS}ms when contacting ${source}`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(message);
      }
    }
  }

  if (!payload) {
    for (const message of errors) {
      console.warn(message);
    }

    if (previous) {
      await writeJson(publicPath, previous);
      console.log('Retained existing rate files.');
      return;
    }

    throw new Error(errors.join('\n'));
  }

  await writeJson(dataPath, payload);
  await writeJson(publicPath, payload);

  if (previous && JSON.stringify(previous) === JSON.stringify(payload)) {
    console.log('Rates unchanged - no updates required.');
  } else {
    console.log('ATO rates updated successfully.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
