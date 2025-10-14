import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ReleaseType = 'patch' | 'minor' | 'major';

type Options = {
  releaseType: ReleaseType;
  notes?: string;
  skipBuild: boolean;
  runPackage: boolean;
  dryRun: boolean;
};

function main() {
  try {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(scriptDir, '..');
    const options = parseArgs(process.argv.slice(2), repoRoot);

    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageLockPath = path.join(repoRoot, 'package-lock.json');
    const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

    const packageJson = readJson(packageJsonPath);
    const currentVersion = String(packageJson.version ?? '').trim();
    if (!currentVersion) {
      throw new Error('package.json does not contain a valid version field.');
    }

    const newVersion = incrementVersion(currentVersion, options.releaseType);
    const lastVersionCommit = findLastVersionCommit(repoRoot, currentVersion);
    const commitMessages = gatherCommits(repoRoot, lastVersionCommit);

    const isoDate = new Date().toISOString().slice(0, 10);
    const normalizedNotes = normalizeMultiline(options.notes);
    const commitLines = commitMessages.map((message) => `- ${message}`);

    if (options.dryRun) {
      console.log(`[dry-run] Would bump version ${currentVersion} -> ${newVersion}`);
      console.log(`[dry-run] Derived commit list (${commitMessages.length}):`);
      commitLines.forEach((line) => console.log(line));
    } else {
      writePackageJson(packageJsonPath, packageJson, newVersion);
      writePackageLock(packageLockPath, newVersion);
      updateChangelog(changelogPath, newVersion, isoDate, normalizedNotes, commitLines);
      writeReleaseNotes(repoRoot, newVersion, isoDate, normalizedNotes, commitLines);
    }

    if (options.dryRun) {
      if (!options.skipBuild) {
        console.log('[dry-run] Would run "npm run build"');
      }
      if (options.runPackage) {
        console.log('[dry-run] Would run "npm run package"');
      }
    } else {
      if (!options.skipBuild) {
        runCommand(repoRoot, ['npm', 'run', 'build'], { stdio: 'inherit' });
      }
      if (options.runPackage) {
        runCommand(repoRoot, ['npm', 'run', 'package'], { stdio: 'inherit' });
      }
    }

    const releaseNotePath = path.join('docs', 'releases', `${newVersion}.md`);
    console.log('Release preparation complete. Updated artifacts:');
    console.log(` - package.json (version ${newVersion})`);
    console.log(' - package-lock.json');
    console.log(' - CHANGELOG.md');
    console.log(` - ${releaseNotePath}`);
    if (!options.skipBuild) {
      console.log(' - dist/* via npm run build');
    }
    if (options.runPackage) {
      console.log(' - release/* via npm run package');
    }
    console.log('\nNext steps:');
    console.log(' 1. Review generated notes and artifacts.');
    console.log(` 2. git add package.json package-lock.json CHANGELOG.md ${releaseNotePath}`);
    if (!options.skipBuild) {
      console.log('    git add dist dist-electron');
    }
    if (options.runPackage) {
      console.log('    git add release');
    }
    console.log(' 3. Commit and push the release.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

function parseArgs(args: string[], repoRoot: string): Options {
  const options: Options = {
    releaseType: 'patch',
    skipBuild: false,
    runPackage: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case '--type': {
        const value = args[index + 1];
        if (!isReleaseType(value)) {
          throw new Error('Expected release type after --type (patch, minor, major).');
        }
        options.releaseType = value;
        index += 1;
        break;
      }
      case '--notes': {
        const value = args[index + 1];
        if (!value) {
          throw new Error('Expected value after --notes.');
        }
        options.notes = options.notes ? `${options.notes}\n${value}` : value;
        index += 1;
        break;
      }
      case '--notes-file': {
        const value = args[index + 1];
        if (!value) {
          throw new Error('Expected file path after --notes-file.');
        }
        const resolved = path.resolve(repoRoot, value);
        if (!existsSync(resolved)) {
          throw new Error(`Notes file not found: ${resolved}`);
        }
        const content = readFileSync(resolved, 'utf8');
        options.notes = options.notes ? `${options.notes}\n${content}` : content;
        index += 1;
        break;
      }
      case '--skip-build': {
        options.skipBuild = true;
        break;
      }
      case '--package': {
        options.runPackage = true;
        break;
      }
      case '--dry-run': {
        options.dryRun = true;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${arg}`);
      }
    }
  }

  return options;
}

function isReleaseType(value: string | undefined): value is ReleaseType {
  return value === 'patch' || value === 'minor' || value === 'major';
}

function readJson(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writePackageJson(filePath: string, packageJson: any, newVersion: string) {
  packageJson.version = newVersion;
  const nextContent = JSON.stringify(packageJson, null, 2);
  writeFileSync(filePath, ensureTrailingNewline(nextContent), 'utf8');
}

function writePackageLock(filePath: string, newVersion: string) {
  if (!existsSync(filePath)) {
    return;
  }
  const lock = readJson(filePath);
  lock.version = newVersion;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = newVersion;
  }
  const nextContent = JSON.stringify(lock, null, 2);
  writeFileSync(filePath, ensureTrailingNewline(nextContent), 'utf8');
}

function findLastVersionCommit(repoRoot: string, version: string): string | null {
  const pattern = `"version": "${version}"`;
  const result = runCommand(repoRoot, [
    'git',
    'log',
    '-n',
    '1',
    '--pretty=format:%H',
    '-G',
    pattern,
    '--',
    'package.json',
  ]);
  return result.trim() ? result.trim() : null;
}

function gatherCommits(repoRoot: string, sinceCommit: string | null): string[] {
  const args = ['git', 'log', '--no-merges', '--pretty=format:%s'];
  if (sinceCommit) {
    args.push(`${sinceCommit}..HEAD`);
  }
  const output = runCommand(repoRoot, args);
  if (!output.trim()) {
    return [];
  }
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line));
}

function normalizeMultiline(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
  return normalized.length ? normalized : undefined;
}

function updateChangelog(
  filePath: string,
  version: string,
  isoDate: string,
  notes: string | undefined,
  commitLines: string[],
) {
  const entryLines = [`## [${version}] - ${isoDate}`];
  if (notes) {
    entryLines.push(notes, '');
  }
  if (commitLines.length) {
    entryLines.push(...commitLines);
  } else {
    entryLines.push('- No recorded commits since previous release.');
  }
  entryLines.push('');
  const entry = entryLines.join('\n');

  let changelog = '';
  if (existsSync(filePath)) {
    changelog = readFileSync(filePath, 'utf8');
  }

  if (!changelog.trim()) {
    changelog =
      '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  } else if (!changelog.trimStart().startsWith('# Changelog')) {
    changelog = `# Changelog\n\n${changelog.trimStart()}\n\n`;
  }

  const marker = '\n## ';
  const insertAt = changelog.indexOf(marker);
  let nextContent: string;
  if (insertAt === -1) {
    nextContent = ensureTrailingNewline(changelog);
    if (!nextContent.endsWith('\n\n')) {
      nextContent += '\n';
    }
    nextContent += entry;
  } else {
    const head = changelog.slice(0, insertAt + 1);
    const tail = changelog.slice(insertAt + 1);
    nextContent = head + entry + tail;
  }

  writeFileSync(filePath, ensureTrailingNewline(nextContent), 'utf8');
}

function writeReleaseNotes(
  repoRoot: string,
  version: string,
  isoDate: string,
  notes: string | undefined,
  commitLines: string[],
) {
  const releasesDir = path.join(repoRoot, 'docs', 'releases');
  if (!existsSync(releasesDir)) {
    mkdirSync(releasesDir, { recursive: true });
  }
  const filePath = path.join(releasesDir, `${version}.md`);
  const lines = [`# Release ${version}`, '', `Date: ${isoDate}`, ''];
  if (notes) {
    lines.push('## Summary');
    lines.push(notes, '');
  }
  lines.push('## Changes');
  if (commitLines.length) {
    lines.push(...commitLines);
  } else {
    lines.push('- No recorded commits since previous release.');
  }
  lines.push('');
  writeFileSync(filePath, ensureTrailingNewline(lines.join('\n')), 'utf8');
}

function incrementVersion(current: string, releaseType: ReleaseType): string {
  const parts = current.split('.').map((segment) => parseInt(segment, 10));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    throw new Error(`Unsupported version format: ${current}`);
  }
  let [major, minor, patch] = parts;
  switch (releaseType) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      throw new Error(`Unsupported release type: ${releaseType}`);
  }
  return [major, minor, patch].join('.');
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`;
}

function runCommand(
  cwd: string,
  command: string[],
  options: { stdio?: 'inherit' | 'pipe' } = {},
): string {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    stdio: options.stdio ?? 'pipe',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? '';
    throw new Error(`Command failed (${command.join(' ')}): ${stderr.trim()}`);
  }
  if (options.stdio === 'inherit') {
    return '';
  }
  return (result.stdout ?? '').toString().trim();
}

main();
