import fs from 'node:fs';
import path from 'node:path';

const rnRoot = path.join(process.cwd(), 'node_modules', 'react-native');

function patchFile(relativePath, replacements) {
  const filePath = path.join(rnRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-react-native-bridgeless] skip missing ${relativePath}`);
    return;
  }

  let source = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, source, 'utf8');
    console.log(`[patch-react-native-bridgeless] patched ${relativePath}`);
  }
}

patchFile('Libraries/BatchedBridge/BatchedBridge.js', [
  [
    `import typeof MessageQueueT from './MessageQueue';

const MessageQueue: MessageQueueT = require('./MessageQueue').default;

const BatchedBridge: MessageQueue = new MessageQueue();`,
    `const MessageQueue = require('./MessageQueue').default;

const BatchedBridge = new MessageQueue();`,
  ],
]);

patchFile('src/private/setup/setUpDefaultReactNativeEnvironment.js', [
  [
    `  require('../../../Libraries/Core/setUpGlobals');
  require('./setUpDOM').default();
  require('../../../Libraries/Core/setUpPerformance');`,
    `  require('../../../Libraries/Core/setUpGlobals');
  require('./setUpDOM').default();
  // Bridge must exist before setUpPerformance (NativePerformance -> TurboModuleRegistry).
  require('../../../Libraries/BatchedBridge/BatchedBridge');
  require('../../../Libraries/Core/setUpBatchedBridge');
  require('../../../Libraries/Core/setUpPerformance');`,
  ],
  [`  require('../../../Libraries/Core/setUpNavigator');
  require('../../../Libraries/Core/setUpBatchedBridge');
  require('../../../Libraries/Core/setUpSegmentFetcher');`, `  require('../../../Libraries/Core/setUpNavigator');
  require('../../../Libraries/Core/setUpSegmentFetcher');`],
]);
