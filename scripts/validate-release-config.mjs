import fs from 'node:fs';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Release config check failed: ${message}`);
  }
}

const app = readJson('app.json').expo;
const eas = readJson('eas.json');

assert(app?.name === 'Reclaim', 'Expo app name must remain Reclaim.');
assert(app?.slug === 'reclaim-v2', 'Expo slug must remain reclaim-v2.');
assert(app?.owner === 'sankalpvoid', 'Expo owner must remain sankalpvoid.');
assert(app?.scheme === 'reclaim', 'Native auth scheme must remain reclaim.');
assert(app?.userInterfaceStyle === 'dark', 'Reclaim v1 must keep the dark native appearance.');
assert(/^\d+\.\d+\.\d+$/.test(app?.version ?? ''), 'App version must use x.y.z format.');

assert(
  app?.ios?.bundleIdentifier === 'app.reclaim.mobile',
  'iOS bundle identifier must remain app.reclaim.mobile.',
);
assert(app?.ios?.supportsTablet === false, 'Reclaim v1 must remain iPhone-only on iOS.');
assert(
  app?.android?.package === 'app.reclaim.mobile',
  'Android package must remain app.reclaim.mobile.',
);
assert(
  app?.extra?.eas?.projectId === '35a0891e-f3e8-4092-9cc3-75fd929a635f',
  'EAS project ID no longer matches @sankalpvoid/reclaim-v2.',
);

const widgets = (app?.plugins ?? []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets',
)?.[1];
assert(widgets, 'expo-widgets configuration is missing.');
assert(
  widgets.bundleIdentifier === 'app.reclaim.mobile.widgets',
  'Widget bundle identifier must remain app.reclaim.mobile.widgets.',
);
assert(
  widgets.groupIdentifier === 'group.app.reclaim.mobile',
  'Widget app group must remain group.app.reclaim.mobile.',
);

assert(eas?.cli?.appVersionSource === 'remote', 'EAS version source must remain remote.');
assert(
  eas?.build?.development?.developmentClient === true &&
    eas?.build?.development?.distribution === 'internal',
  'Development profile must remain an internal development-client build.',
);
assert(
  eas?.build?.preview?.distribution === 'internal',
  'Preview profile must remain internal.',
);
assert(
  eas?.build?.['preview-simulator']?.ios?.simulator === true,
  'preview-simulator must remain an iOS simulator build.',
);
assert(
  eas?.build?.['development-simulator']?.developmentClient === true &&
    eas?.build?.['development-simulator']?.ios?.simulator === true,
  'development-simulator must remain an iOS simulator development-client build.',
);
assert(
  eas?.build?.production?.autoIncrement === true,
  'Production builds must auto-increment developer-facing build numbers.',
);

console.log('Release configuration invariants verified.');
