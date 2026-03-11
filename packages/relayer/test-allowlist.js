/**
 * Manual test script for target allowlist functionality
 * Run with: node test-allowlist.js
 */

// Test 1: Single target from EXAMPLE_TARGET_ADDRESS
console.log('\n=== Test 1: Single target from EXAMPLE_TARGET_ADDRESS ===');
process.env.EXAMPLE_TARGET_ADDRESS = '0x1234567890123456789012345678901234567890';
delete process.env.ALLOWED_TARGETS;
delete require.cache[require.resolve('./dist/config.js')];
const config1 = require('./dist/config.js').config;
console.log('Expected: 1 target');
console.log('Actual:', config1.allowedTargets.length, 'targets');
console.log('Targets:', config1.allowedTargets);
console.log('✅ PASS:', config1.allowedTargets.length === 1 && 
  config1.allowedTargets[0] === '0x1234567890123456789012345678901234567890');

// Test 2: Multiple targets from ALLOWED_TARGETS
console.log('\n=== Test 2: Multiple targets from ALLOWED_TARGETS ===');
process.env.ALLOWED_TARGETS = '0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222,0x3333333333333333333333333333333333333333';
delete require.cache[require.resolve('./dist/config.js')];
const config2 = require('./dist/config.js').config;
console.log('Expected: 3 targets');
console.log('Actual:', config2.allowedTargets.length, 'targets');
console.log('Targets:', config2.allowedTargets);
console.log('✅ PASS:', config2.allowedTargets.length === 3);

// Test 3: ALLOWED_TARGETS takes priority
console.log('\n=== Test 3: ALLOWED_TARGETS takes priority over EXAMPLE_TARGET_ADDRESS ===');
process.env.EXAMPLE_TARGET_ADDRESS = '0x9999999999999999999999999999999999999999';
process.env.ALLOWED_TARGETS = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
delete require.cache[require.resolve('./dist/config.js')];
const config3 = require('./dist/config.js').config;
console.log('Expected: 2 targets (not including EXAMPLE_TARGET_ADDRESS)');
console.log('Actual:', config3.allowedTargets.length, 'targets');
console.log('Targets:', config3.allowedTargets);
console.log('✅ PASS:', config3.allowedTargets.length === 2 && 
  !config3.allowedTargets.includes('0x9999999999999999999999999999999999999999'));

// Test 4: Whitespace handling
console.log('\n=== Test 4: Whitespace handling ===');
process.env.ALLOWED_TARGETS = ' 0x1111111111111111111111111111111111111111 , 0x2222222222222222222222222222222222222222 ';
delete require.cache[require.resolve('./dist/config.js')];
const config4 = require('./dist/config.js').config;
console.log('Expected: 2 targets, trimmed');
console.log('Actual:', config4.allowedTargets.length, 'targets');
console.log('Targets:', config4.allowedTargets);
console.log('✅ PASS:', config4.allowedTargets.length === 2 && 
  config4.allowedTargets[0] === '0x1111111111111111111111111111111111111111');

// Test 5: Case insensitivity
console.log('\n=== Test 5: Case insensitivity (lowercase conversion) ===');
process.env.ALLOWED_TARGETS = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
delete require.cache[require.resolve('./dist/config.js')];
const config5 = require('./dist/config.js').config;
console.log('Expected: lowercase address');
console.log('Actual:', config5.allowedTargets[0]);
console.log('✅ PASS:', config5.allowedTargets[0] === '0xabcdef1234567890abcdef1234567890abcdef12');

// Test 6: Empty entries filtered
console.log('\n=== Test 6: Empty entries filtered ===');
process.env.ALLOWED_TARGETS = '0x1111111111111111111111111111111111111111,,0x2222222222222222222222222222222222222222,  ,';
delete require.cache[require.resolve('./dist/config.js')];
const config6 = require('./dist/config.js').config;
console.log('Expected: 2 targets (empty entries removed)');
console.log('Actual:', config6.allowedTargets.length, 'targets');
console.log('Targets:', config6.allowedTargets);
console.log('✅ PASS:', config6.allowedTargets.length === 2);

// Test 7: Validator accepts allowed target
console.log('\n=== Test 7: Validator accepts allowed target ===');
process.env.ALLOWED_TARGETS = '0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222';
delete require.cache[require.resolve('./dist/config.js')];
delete require.cache[require.resolve('./dist/validator.js')];
const { validateRelayRequest } = require('./dist/validator.js');
const request1 = {
  from: '0x1234567890123456789012345678901234567890',
  to: '0x1111111111111111111111111111111111111111',
  value: '0',
  gas: '100000',
  deadline: Math.floor(Date.now() / 1000) + 3600,
  data: '0x1234',
};
const result1 = validateRelayRequest(request1, '0x' + 'a'.repeat(130));
console.log('Expected: valid = true');
console.log('Actual:', result1);
console.log('✅ PASS:', result1.valid === true);

// Test 8: Validator rejects non-allowed target
console.log('\n=== Test 8: Validator rejects non-allowed target ===');
const request2 = {
  from: '0x1234567890123456789012345678901234567890',
  to: '0x9999999999999999999999999999999999999999',
  value: '0',
  gas: '100000',
  deadline: Math.floor(Date.now() / 1000) + 3600,
  data: '0x1234',
};
const result2 = validateRelayRequest(request2, '0x' + 'a'.repeat(130));
console.log('Expected: valid = false, error = "Target contract not allowed"');
console.log('Actual:', result2);
console.log('✅ PASS:', result2.valid === false && result2.error === 'Target contract not allowed');

// Test 9: Case-insensitive matching
console.log('\n=== Test 9: Case-insensitive target matching ===');
process.env.ALLOWED_TARGETS = '0xabcdef1234567890abcdef1234567890abcdef12';
delete require.cache[require.resolve('./dist/config.js')];
delete require.cache[require.resolve('./dist/validator.js')];
const { validateRelayRequest: validateRelayRequest2 } = require('./dist/validator.js');
const request3 = {
  from: '0x1234567890123456789012345678901234567890',
  to: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', // Uppercase
  value: '0',
  gas: '100000',
  deadline: Math.floor(Date.now() / 1000) + 3600,
  data: '0x1234',
};
const result3 = validateRelayRequest2(request3, '0x' + 'a'.repeat(130));
console.log('Expected: valid = true (case-insensitive match)');
console.log('Actual:', result3);
console.log('✅ PASS:', result3.valid === true);

console.log('\n=== All Tests Complete ===\n');
