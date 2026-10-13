import { drawSample, normalDensity, studentTDensity, studentTCdf, studentTQuantile } from './stats.mjs';

const $ = (id) => document.getElementById(id);
const colors = { null: '#207994', alt: '#d36d4e', theory: '#7462a3', grid: '#e7eded', text: '#70818a', ink: '#17304a' };
const state = {
  config: { nullMu: 50, nullSigma: 10, altMu: 55, altSigma: 10, n: 16 },
  nullSamples: [], altSamples: [], selected: null, serial: { null: 0, alt: 0 }
};
const inputs = ['null-mu', 'null-sigma', 'alt-mu', 'alt-sigma', 'sample-size'];
const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const fixed = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—';

function readConfig() {
  const values = inputs.map((id) => Number($(id).value));
  const [nullMu, nullSigma, altMu, altSigma, n] = values;
  if (inputs.some((id) => $(id).value.trim() === '') || values.some((value) => !Number.isFinite(value)) ||
      nullSigma <= 0 || altSigma <= 0 || !Number.isInteger(n) || n < 2 || n > 1000) {
    $('control-message').textContent = 'Enter valid means, positive SDs, and a whole sample size from 2 to 1,000.';
    return null;
  }
  $('control-message').textContent = '';
  return { nullMu, nullSigma, altMu, altSigma, n };
}

function clearSamples() {
  state.nullSamples = [];
  state.altSamples = [];
  state.selected = null;
  state.serial = { null: 0, alt: 0 };
  render();
}

function syncConfig() {
  const next = readConfig();
  if (!next) return false;
  if (Object.keys(next).some((key) => next[key] !== state.config[key])) {
    state.config = next;
    clearSamples();
  }
  return true;
}

function addSamples(group, count) {
  if (!syncConfig()) return;
  const { nullMu, nullSigma, altMu, altSigma, n } = state.config;
  const mu = group === 'null' ? nullMu : altMu;
  const sigma = group === 'null' ? nullSigma : altSigma;
  const samples = group === 'null' ? state.nullSamples : state.altSamples;
  for (let i = 0; i < count; i++) {
    const sample = drawSample(mu, sigma, n, nullMu);
    sample.sequence = ++state.serial[group];
    samples.push(sample);
    state.selected = { group, sample };
  }
  if (samples.length > 3000) {
    samples.splice(0, samples.length - 3000);
    $('control-message').textContent = 'Showing the most recent 3,000 samples from this population.';
  }
  render();
}

function drawBatch(group) {
  const input = $('batch-size');
  const count = Number(input.value);
  if (!Number.isInteger(count) || count < 2 || count > 1000) {
    $('control-message').textContent = 'Choose a whole batch size from 2 to 1,000.';
    return;
  }
  addSamples(group, count);
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext('2d');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function chartFrame(canvas, domain, maxY, tickCount = 5) {
  const { context: ctx, width, height } = prepareCanvas(canvas);
  const left = width < 420 ? 32 : 42;
  const right = 14;
  const top = 14;
  const bottom = 35;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (value) => left + (value - domain[0]) / (domain[1] - domain[0]) * plotWidth;
  const y = (value) => top + plotHeight * (1 - value / maxY);
  ctx.font = '11px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= tickCount; i++) {
    const value = domain[0] + (domain[1] - domain[0]) * i / tickCount;
    const px = x(value);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, y(0)); ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.fillText(formatter.format(value), px, height - 23);
  }
  ctx.strokeStyle = '#adbdc1';
  ctx.beginPath(); ctx.moveTo(left, y(0)); ctx.lineTo(width - right, y(0)); ctx.stroke();
  return { ctx, x, y, left, right, top, bottom, width, height, plotWidth, plotHeight, domain };
}

function drawVertical(frame, value, label, color, dashed = true) {
  if (value < frame.domain[0] || value > frame.domain[1]) return;
  const { ctx, x, y, top } = frame;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(dashed ? [4, 4] : []);
  ctx.beginPath(); ctx.moveTo(x(value), top); ctx.lineTo(x(value), y(0)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = '700 11px "DM Sans", Arial, sans-serif';
  ctx.textAlign = x(value) > frame.width - 75 ? 'right' : 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x(value) + (ctx.textAlign === 'right' ? -4 : 4), top + 2);
  ctx.restore();
}

function drawCurve(frame, density, color, maxY, lineWidth = 2.5) {
  const { ctx, domain, x, y, plotWidth } = frame;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i <= plotWidth; i++) {
    const value = domain[0] + i / plotWidth * (domain[1] - domain[0]);
    const py = y(Math.min(maxY, density(value)));
    if (i === 0) ctx.moveTo(x(value), py); else ctx.lineTo(x(value), py);
  }
  ctx.stroke(); ctx.restore();
}

function drawEmpty(frame, text) {
  const { ctx, width, height } = frame;
  ctx.fillStyle = colors.text;
  ctx.font = '13px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
}

function drawPopulation() {
  const { nullMu, nullSigma, altMu, altSigma } = state.config;
  const low = Math.min(nullMu - 3.7 * nullSigma, altMu - 3.7 * altSigma);
  const high = Math.max(nullMu + 3.7 * nullSigma, altMu + 3.7 * altSigma);
  const peak = Math.max(normalDensity(nullMu, nullMu, nullSigma), normalDensity(altMu, altMu, altSigma));
  const frame = chartFrame($('population-chart'), [low, high], peak * 1.18, 4);
  drawCurve(frame, (value) => normalDensity(value, nullMu, nullSigma), colors.null, peak * 1.18);
  drawCurve(frame, (value) => normalDensity(value, altMu, altSigma), colors.alt, peak * 1.18);
  const selected = state.selected;
  if (selected) {
    const sample = selected.sample;
    const color = colors[selected.group];
    const floor = frame.y(0);
    const radius = sample.values.length > 70 ? 2.2 : 3.2;
    frame.ctx.save();
    frame.ctx.fillStyle = color;
    frame.ctx.globalAlpha = sample.values.length > 70 ? 0.5 : 0.75;
    sample.values.forEach((value, index) => {
      frame.ctx.beginPath();
      frame.ctx.arc(frame.x(value), floor - 8 - (index % 3) * 7, radius, 0, Math.PI * 2);
      frame.ctx.fill();
    });
    frame.ctx.restore();
  }
  $('population-note').textContent = selected
    ? `The ${selected.group === 'null' ? 'null' : 'alternative'} sample has ${state.config.n} individual observations; its mean is ${fixed(selected.sample.ybar)}.`
    : 'Draw a sample to see its observations here.';
}

function histogram(values, domain, bins = 28) {
  const binWidth = (domain[1] - domain[0]) / bins;
  const counts = new Array(bins).fill(0);
  for (const value of values) {
    if (value < domain[0] || value > domain[1]) continue;
    const index = Math.min(bins - 1, Math.floor((value - domain[0]) / binWidth));
    counts[index]++;
  }
  return { heights: counts.map((count) => count / (values.length * binWidth)), binWidth };
}

function drawBars(frame, histogramData, color, groupIndex, maxY) {
  const { ctx, x, y, domain } = frame;
  const width = histogramData.binWidth;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.66;
  histogramData.heights.forEach((height, index) => {
    const binStart = domain[0] + index * width;
    const binPixelWidth = x(binStart + width) - x(binStart);
    const barWidth = binPixelWidth * 0.43;
    const px = x(binStart) + binPixelWidth * (groupIndex === 0 ? 0.06 : 0.51);
    ctx.fillRect(px, y(Math.min(height, maxY)), barWidth, y(0) - y(Math.min(height, maxY)));
  });
  ctx.restore();
}

function drawSelectedTick(frame, value, color) {
  if (value < frame.domain[0] || value > frame.domain[1]) return;
  const { ctx, x, y } = frame;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x(value), y(0) - 1);
  ctx.lineTo(x(value) - 5, y(0) - 8);
  ctx.lineTo(x(value) + 5, y(0) - 8);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawDistribution(canvas, field, options = {}) {
  const nullValues = state.nullSamples.map((sample) => sample[field]);
  const altValues = state.altSamples.map((sample) => sample[field]);
  const { nullMu, nullSigma, altMu, altSigma, n } = state.config;
  const se0 = nullSigma / Math.sqrt(n);
  const se1 = altSigma / Math.sqrt(n);
  let domain;
  if (field === 'ybar') {
    const low = Math.min(nullMu - 4 * se0, altMu - 4 * se1, ...nullValues, ...altValues);
    const high = Math.max(nullMu + 4 * se0, altMu + 4 * se1, ...nullValues, ...altValues);
    const pad = (high - low) * 0.035;
    domain = [low - pad, high + pad];
  } else {
    const critical = options.rejection ? studentTQuantile(1 - options.alpha / 2, n - 1) : 0;
    const maxAbs = Math.max(4.5, critical * 1.12, ...nullValues.map(Math.abs), ...altValues.map(Math.abs));
    domain = [-maxAbs * 1.08, maxAbs * 1.08];
  }
  const nullHist = nullValues.length ? histogram(nullValues, domain) : null;
  const altHist = altValues.length ? histogram(altValues, domain) : null;
  const df = n - 1;
  const theoryPeak = field === 't' && options.theory ? studentTDensity(0, df) : 0;
  const maxBar = Math.max(0, ...(nullHist?.heights || []), ...(altHist?.heights || []));
  const maxY = Math.max(theoryPeak, maxBar, 0.001) * 1.19;
  const frame = chartFrame(canvas, domain, maxY, field === 't' ? 6 : 4);

  if (field === 't' && options.rejection) {
    const critical = studentTQuantile(1 - options.alpha / 2, df);
    frame.ctx.save();
    frame.ctx.fillStyle = 'rgba(211,109,78,.085)';
    frame.ctx.fillRect(frame.x(domain[0]), frame.top, frame.x(-critical) - frame.x(domain[0]), frame.plotHeight);
    frame.ctx.fillRect(frame.x(critical), frame.top, frame.x(domain[1]) - frame.x(critical), frame.plotHeight);
    frame.ctx.restore();
    drawVertical(frame, -critical, `−${fixed(critical)}`, '#b65b45');
    drawVertical(frame, critical, `+${fixed(critical)}`, '#b65b45');
  }
  if (nullHist) drawBars(frame, nullHist, colors.null, 0, maxY);
  if (altHist) drawBars(frame, altHist, colors.alt, 1, maxY);
  if (field === 't' && options.theory) drawCurve(frame, (value) => studentTDensity(value, df), colors.theory, maxY, 3);
  if (field === 'ybar') drawVertical(frame, nullMu, 'μ₀', colors.ink);
  else drawVertical(frame, 0, 't = 0', colors.ink);
  if (state.selected) drawSelectedTick(frame, state.selected.sample[field], colors[state.selected.group]);
  if (!nullValues.length && !altValues.length) drawEmpty(frame, 'Draw samples to build this distribution');
}

let shownObservationSample = null;
function renderObservations() {
  const list = $('observation-list');
  const sample = state.selected?.sample;
  if (!sample || !$('sample-observations').open) {
    list.replaceChildren();
    shownObservationSample = null;
    return;
  }
  if (sample === shownObservationSample) return;
  const fragment = document.createDocumentFragment();
  sample.values.forEach((value) => {
    const item = document.createElement('span');
    item.textContent = fixed(value);
    fragment.appendChild(item);
  });
  list.replaceChildren(fragment);
  shownObservationSample = sample;
}

function renderDetail() {
  const selected = state.selected;
  $('sample-empty').hidden = Boolean(selected);
  $('sample-detail').hidden = !selected;
  $('sample-badge').className = `sample-badge${selected ? ` ${selected.group}-selected` : ''}`;
  $('sample-badge').textContent = selected ? `${selected.group === 'null' ? 'Null' : 'Alternative'} sample #${selected.sample.sequence}` : 'No sample selected';
  if (!selected) { renderObservations(); return; }
  const { ybar, s, t } = selected.sample;
  const { nullMu, n } = state.config;
  $('detail-ybar').textContent = fixed(ybar);
  $('detail-s').textContent = fixed(s);
  $('detail-t').textContent = fixed(t);
  $('detail-df').textContent = `df = ${n - 1}`;
  $('detail-equation').innerHTML = `<strong>Calculation:</strong> (${fixed(ybar)} − ${fixed(nullMu)}) / (${fixed(s)} / √${n}) = ${fixed(t)}. The test always uses μ₀, even for alternative samples.`;
  const p = Math.min(1, 2 * studentTCdf(-Math.abs(t), n - 1));
  $('detail-p').hidden = false;
  $('detail-p').textContent = `Two-sided p-value under H₀: ${p < 0.0001 ? '< 0.0001' : fixed(p, 4)}${selected.group === 'alt' ? ' (evaluated against the null)' : ''}.`;
  renderObservations();
  const recent = [
    ...state.nullSamples.slice(-4).reverse().map((sample) => ({ group: 'null', sample })),
    ...state.altSamples.slice(-4).reverse().map((sample) => ({ group: 'alt', sample }))
  ];
  $('history-list').replaceChildren(...recent.map(({ group, sample }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `history-button ${group}-history`;
    button.setAttribute('aria-pressed', String(group === selected.group && sample === selected.sample));
    button.setAttribute('aria-label', `${group === 'null' ? 'Null' : 'Alternative'} sample ${sample.sequence}: mean ${fixed(sample.ybar)}, t score ${fixed(sample.t)}`);
    button.innerHTML = `<b>${group === 'null' ? 'H₀' : 'H₁'} #${sample.sequence}</b><span>ȳ ${fixed(sample.ybar)}</span><span>t ${fixed(sample.t)}</span>`;
    button.addEventListener('click', () => { state.selected = { group, sample }; render(); });
    return button;
  }));
}

function render() {
  const { nullMu, n } = state.config;
  $('null-count').textContent = formatter.format(state.nullSamples.length);
  $('alt-count').textContent = formatter.format(state.altSamples.length);
  $('reference-mean').textContent = formatter.format(nullMu);
  $('df-value').textContent = n - 1;
  const theory = $('show-theory').checked;
  const rejection = $('show-rejection').checked;
  const alpha = Number($('alpha').value);
  $('theory-legend').hidden = !theory;
  $('alpha').disabled = !rejection;
  drawPopulation();
  drawDistribution($('means-chart'), 'ybar');
  drawDistribution($('t-chart'), 't', { theory, rejection, alpha });
  $('t-note').textContent = rejection
    ? `Two-sided α = ${alpha.toFixed(2)}: scores beyond ±${fixed(studentTQuantile(1 - alpha / 2, n - 1))} fall in the rejection regions under H₀.`
    : theory
      ? `The smooth purple curve is Student t with ${n - 1} degrees of freedom; null samples should approach it as you draw more.`
      : 'Turn on the theoretical curve to compare simulation with the exact null distribution.';
  renderDetail();
}

$('draw-null').addEventListener('click', () => addSamples('null', 1));
$('draw-alt').addEventListener('click', () => addSamples('alt', 1));
$('batch-null').addEventListener('click', () => drawBatch('null'));
$('batch-alt').addEventListener('click', () => drawBatch('alt'));
$('reset').addEventListener('click', () => { $('control-message').textContent = ''; clearSamples(); });
inputs.forEach((id) => $(id).addEventListener('change', syncConfig));
['show-theory', 'show-rejection', 'alpha'].forEach((id) => $(id).addEventListener('change', render));
$('sample-observations').addEventListener('toggle', renderObservations);
let resizeFrame = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(render);
}).observe(document.querySelector('.workbench'));
render();
