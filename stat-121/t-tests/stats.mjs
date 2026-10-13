// Pure statistical functions shared by the simulator and its checks.
export function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sampleStandardDeviation(values) {
  const center = mean(values);
  const sumSquares = values.reduce((sum, value) => sum + (value - center) ** 2, 0);
  return Math.sqrt(sumSquares / (values.length - 1));
}

export function normalDensity(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function normalDraw(mu, sigma, random = Math.random) {
  // Box–Muller transform; protect against log(0) for injected generators.
  let u = 0;
  while (u === 0) u = random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

export function drawSample(mu, sigma, n, nullMean, random = Math.random) {
  const values = Array.from({ length: n }, () => normalDraw(mu, sigma, random));
  const ybar = mean(values);
  const s = sampleStandardDeviation(values);
  return { values, ybar, s, t: (ybar - nullMean) / (s / Math.sqrt(n)) };
}

// Lanczos log gamma, used for the exact Student t density and CDF.
export function logGamma(z) {
  const coefficients = [
    0.9999999999998099, 676.5203681218851, -1259.1392167224028,
    771.3234287776531, -176.6150291621406, 12.507343278686905,
    -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  let x = coefficients[0];
  const shifted = z - 1;
  for (let i = 1; i < coefficients.length; i++) x += coefficients[i] / (shifted + i);
  const t = shifted + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

export function studentTDensity(x, df) {
  const logConstant = logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI);
  return Math.exp(logConstant - ((df + 1) / 2) * Math.log1p(x * x / df));
}

function betaFraction(a, b, x) {
  const tiny = 1e-30;
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const change = d * c;
    h *= change;
    if (Math.abs(change - 1) < 3e-14) break;
  }
  return h;
}

function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  if (x < (a + 1) / (a + b + 2)) return front * betaFraction(a, b, x) / a;
  return 1 - front * betaFraction(b, a, 1 - x) / b;
}

export function studentTCdf(x, df) {
  if (x === 0) return 0.5;
  const tail = 0.5 * regularizedBeta(df / (df + x * x), df / 2, 0.5);
  return x < 0 ? tail : 1 - tail;
}

export function studentTQuantile(probability, df) {
  if (probability <= 0 || probability >= 1) throw new RangeError('Probability must be between 0 and 1.');
  if (probability === 0.5) return 0;
  if (probability < 0.5) return -studentTQuantile(1 - probability, df);
  let low = 0;
  let high = 1;
  while (studentTCdf(high, df) < probability) high *= 2;
  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2;
    if (studentTCdf(mid, df) < probability) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
