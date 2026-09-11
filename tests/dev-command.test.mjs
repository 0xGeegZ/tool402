import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDevEnvironment } from '../scripts/dev.mjs';

test('parses a development-only Convex runtime', () => {
  assert.deepEqual(parseDevEnvironment([
    'CONVEX_DEPLOYMENT=dev:efficient-trout-633',
    'CONVEX_SITE_URL=https://efficient-trout-633.eu-west-1.convex.site',
  ].join('\n')), {
    deployment: 'dev:efficient-trout-633',
    site: 'https://efficient-trout-633.eu-west-1.convex.site',
  });
});

test('rejects a production Convex deployment', () => {
  assert.throws(
    () => parseDevEnvironment('CONVEX_DEPLOYMENT=prod:wooden-wolverine-59\nCONVEX_SITE_URL=https://wooden-wolverine-59.eu-west-1.convex.site'),
    /development deployment/u,
  );
});

test('rejects a non-site Convex URL', () => {
  assert.throws(
    () => parseDevEnvironment('CONVEX_DEPLOYMENT=dev:efficient-trout-633\nCONVEX_SITE_URL=https://efficient-trout-633.eu-west-1.convex.cloud'),
    /Convex site URL/u,
  );
});
