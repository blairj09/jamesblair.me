import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mean, sampleStandardDeviation, drawSample,
  studentTDensity, studentTCdf, studentTQuantile
} from './stats.mjs';

test('sample statistics use n − 1 and center t on the null mean', () => {
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(sampleStandardDeviation([2, 4, 6]), 2);
  // Box–Muller with cos(0): the chosen uniforms produce z scores 0 and 1.
  const uniforms = [1, 0, Math.exp(-0.5), 0];
  const sample = drawSample(10, 2, 2, 10, () => uniforms.shift());
  assert.deepEqual(sample.values, [10, 12]);
  assert.ok(Math.abs(sample.ybar - 11) < 1e-12);
  assert.ok(Math.abs(sample.s - Math.SQRT2) < 1e-12);
  assert.ok(Math.abs(sample.t - 1) < 1e-12);
});

test('Student t density, CDF, and critical value agree with known df = 1 values', () => {
  // A t distribution with one degree of freedom is Cauchy.
  assert.ok(Math.abs(studentTDensity(0, 1) - 1 / Math.PI) < 1e-12);
  assert.ok(Math.abs(studentTCdf(1, 1) - 0.75) < 1e-12);
  assert.ok(Math.abs(studentTCdf(-1, 1) - 0.25) < 1e-12);
  assert.ok(Math.abs(studentTQuantile(0.975, 1) - 12.706204736) < 1e-8);
});

test('two-sided 5% cutoff for df = 15 and CDF symmetry', () => {
  const cutoff = studentTQuantile(0.975, 15);
  assert.ok(Math.abs(cutoff - 2.131449546) < 1e-8);
  assert.ok(Math.abs(studentTCdf(-cutoff, 15) - 0.025) < 1e-12);
});
