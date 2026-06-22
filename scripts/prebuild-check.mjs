#!/usr/bin/env node
/**
 * Run before `eas build` to catch failures locally.
 * Usage: npm run prebuild:check
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'google-services.json',
  'GoogleService-Info.plist',
  'app.config.ts',
  'app.json',
  'eas.json',
];

const checks = [];

function run(name, command) {
  try {
    execSync(command, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
    checks.push({ name, ok: true });
  } catch (error) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim();
    checks.push({ name, ok: false, detail: output.slice(-1200) });
  }
}

function assert(name, ok, detail) {
  checks.push({ name, ok, detail });
}

for (const file of requiredFiles) {
  assert(`File: ${file}`, fs.existsSync(path.join(root, file)));
}

try {
  const services = JSON.parse(fs.readFileSync(path.join(root, 'google-services.json'), 'utf8'));
  const playClient = (services.client ?? []).find(
    (c) => c.client_info?.android_client_info?.package_name === 'com.youhooalert.com'
  );
  const webClient = playClient?.oauth_client?.find((o) => o.client_type === 3);
  assert(
    'Firebase Web OAuth client (com.youhooalert.com)',
    Boolean(webClient?.client_id),
    webClient?.client_id ?? 'missing client_type 3'
  );
} catch (error) {
  assert('Firebase Web OAuth client (com.youhooalert.com)', false, String(error));
}

try {
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
  const env = eas.build?.base?.env ?? {};
  const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  assert(
    'eas.json EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    Boolean(webClientId),
    webClientId ?? 'not set in eas.json base env'
  );

  for (const key of [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ]) {
    assert(`eas.json ${key}`, Boolean(env[key]), env[key] ?? 'not set in eas.json base env');
  }
} catch (error) {
  assert('eas.json production env', false, String(error));
}

try {
  const configJson = execSync('npx expo config --json', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const config = JSON.parse(configJson);
  assert('expo config loads', true);
  assert(
    'extra.googleWebClientId',
    Boolean(config.extra?.googleWebClientId),
    config.extra?.googleWebClientId ?? 'missing'
  );
  const googlePlugin = (config.plugins ?? []).find(
    (p) => Array.isArray(p) && p[0] === '@react-native-google-signin/google-signin'
  );
  const iosUrlScheme =
    googlePlugin && typeof googlePlugin[1] === 'object' && googlePlugin[1] !== null
      ? (googlePlugin[1] as { iosUrlScheme?: string }).iosUrlScheme
      : undefined;
  assert(
    'Google Sign-In iosUrlScheme',
    Boolean(iosUrlScheme),
    iosUrlScheme ?? 'missing — rebuild app.config.ts / google-services.json'
  );
  assert(
    'android.googleServicesFile',
    Boolean(config.android?.googleServicesFile),
    config.android?.googleServicesFile ?? 'missing'
  );
} catch (error) {
  assert('expo config loads', false, `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim());
}

run('TypeScript (tsc)', 'npx tsc --noEmit');
run('ESLint', 'npm run lint');
run('Android JS bundle', 'npx expo export --platform android');

const failed = checks.filter((c) => !c.ok);

console.log('\n=== Pre-build check report ===\n');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name}`);
  if (!check.ok && check.detail) {
    console.log(`       ${check.detail.split('\n').join('\n       ')}\n`);
  }
}

console.log(`\n${checks.length - failed.length}/${checks.length} passed`);

if (failed.length) {
  console.error('\nFix failures above before running eas build.');
  process.exit(1);
}

console.log('\nReady for: npm run eas:build:android');
