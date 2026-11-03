// Exam 1 results: draws aggregate charts from data.json (made by aggregate.py).
(() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const fmt1 = (v) => v.toFixed(1);
  const pct = (v) => `${Math.round(v * 100)}%`;
  const tooltip = document.getElementById('tooltip');
  let data;

  function el(tag, attrs = {}, parent) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, value, attrs = {}) {
    const t = el('text', { x, y, ...attrs }, parent);
    t.textContent = value;
    return t;
  }

  function showTip(event, head, line) {
    tooltip.replaceChildren();
    const b = document.createElement('b');
    b.textContent = head;
    tooltip.append(b, document.createTextNode(line));
    tooltip.hidden = false;
    const pad = 12;
    const w = tooltip.offsetWidth;
    const h = tooltip.offsetHeight;
    tooltip.style.left = `${Math.min(window.innerWidth - w - 8, event.clientX + pad)}px`;
    tooltip.style.top = `${Math.max(8, event.clientY - h - pad)}px`;
  }
  const hideTip = () => { tooltip.hidden = true; };

  function bindTip(node, head, line) {
    node.addEventListener('pointerenter', (e) => showTip(e, head, line));
    node.addEventListener('pointermove', (e) => showTip(e, head, line));
    node.addEventListener('pointerleave', hideTip);
  }

  function niceShareMax(v) {
    const steps = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1];
    return steps.find((s) => s >= v) ?? 1;
  }

  function histogram(container, series, color, yMax) {
    const W = Math.max(300, container.clientWidth);
    const H = 230;
    const m = { t: 22, r: 10, b: 30, l: 40 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
    const possible = data.possible;
    const x = (v) => m.l + (v / possible) * (W - m.l - m.r);
    const y = (s) => H - m.b - (s / yMax) * (H - m.t - m.b);

    const grid = el('g', { class: 'grid' }, svg);
    const step = yMax <= 0.3 ? 0.05 : 0.1;
    for (let i = 0; i * step <= yMax + 1e-9; i++) {
      const s = i * step;
      el('line', { x1: m.l, x2: W - m.r, y1: y(s), y2: y(s) }, grid);
      text(svg, m.l - 6, y(s) + 4, pct(s), { 'text-anchor': 'end' });
    }
    const axis = el('g', { class: 'axis' }, svg);
    el('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, axis);
    for (let v = 0; v <= possible; v += 6) {
      el('line', { x1: x(v), x2: x(v), y1: H - m.b, y2: H - m.b + 4 }, axis);
      text(svg, x(v), H - m.b + 17, String(v), { 'text-anchor': 'middle' });
    }

    for (const bin of series.bins) {
      const share = bin.count / series.n;
      const bar = el('rect', {
        class: 'bar', x: x(bin.from) + 1, width: Math.max(0, x(bin.to) - x(bin.from) - 2),
        y: y(share), height: Math.max(0, y(0) - y(share)), rx: 1, fill: color,
      }, svg);
      // A transparent hit area keeps short bars easy to hover.
      const hit = el('rect', { x: x(bin.from), width: x(bin.to) - x(bin.from), y: m.t, height: H - m.t - m.b, fill: 'transparent' }, svg);
      const line = `${bin.count} student${bin.count === 1 ? '' : 's'} (${pct(share)})`;
      bindTip(hit, `${bin.from}–${bin.to} points`, line);
      hit.addEventListener('pointerenter', () => bar.style.opacity = '.75');
      hit.addEventListener('pointerleave', () => bar.style.opacity = '');
    }

    const mx = x(series.median);
    el('line', { class: 'median-line', x1: mx, x2: mx, y1: m.t - 6, y2: H - m.b }, svg);
    const label = text(svg, mx - 6, m.t - 10, `median ${fmt1(series.median)}`, { 'text-anchor': 'end', class: 'value-label' });
    container.replaceChildren(svg);
    if (label.getBBox().x < m.l) {
      label.setAttribute('x', mx + 6);
      label.setAttribute('text-anchor', 'start');
    }
  }

  function bands(container) {
    const rows = data.both.bands;
    const W = Math.max(300, container.clientWidth);
    const rowH = 30;
    const m = { t: 6, r: 44, b: 6, l: 128 };
    const H = m.t + m.b + rows.length * rowH;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
    const max = Math.max(...rows.map((r) => r.count), 1);
    const x = (c) => m.l + (c / max) * (W - m.l - m.r);
    rows.forEach((row, i) => {
      const yTop = m.t + i * rowH;
      const higher = row.label.endsWith('higher');
      text(svg, m.l - 10, yTop + rowH / 2 + 4, row.label, { 'text-anchor': 'end' });
      const bar = el('rect', {
        class: 'bar', x: m.l, y: yTop + 5, height: rowH - 10, width: Math.max(0, x(row.count) - m.l), rx: 1,
        fill: higher ? css('--series-a') : '#b7b8ab',
      }, svg);
      text(svg, x(row.count) + 6, yTop + rowH / 2 + 4, String(row.count), { class: 'value-label' });
      bindTip(bar, row.label, `${row.count} of ${data.both.n} students`);
    });
    el('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, stroke: css('--line') }, svg);
    container.replaceChildren(svg);
  }

  function fillText() {
    document.querySelectorAll('[data-fill]').forEach((node) => {
      const value = node.dataset.fill.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
      if (value == null) return;
      if (typeof value === 'number' && (node.hasAttribute('data-decimal') || !Number.isInteger(value))) {
        node.textContent = (node.hasAttribute('data-sign') && value > 0 ? '+' : '') + fmt1(value);
      } else {
        node.textContent = String(value);
      }
    });
    const body = document.getElementById('summary-body');
    body.replaceChildren(...data.summary.map((row) => {
      const tr = document.createElement('tr');
      const cells = [row.group, String(row.n), ...['mean', 'sd', 'min', 'q1', 'median', 'q3', 'max'].map((k) => fmt1(row[k]))];
      for (const [i, value] of cells.entries()) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = value;
        tr.appendChild(cell);
      }
      return tr;
    }));
  }

  function draw() {
    const a = data.versions.airbnb_telco;
    const b = data.versions.covid_billionaires;
    const shareMax = (s) => Math.max(...s.bins.map((bin) => bin.count / s.n));
    const versionMax = niceShareMax(Math.max(shareMax(a), shareMax(b)));
    histogram(document.getElementById('hist-a'), a, css('--series-a'), versionMax);
    histogram(document.getElementById('hist-b'), b, css('--series-b'), versionMax);
    bands(document.getElementById('bands'));
    histogram(document.getElementById('hist-kept'), data.kept, css('--series-k'), niceShareMax(shareMax(data.kept)));
  }

  fetch('data.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((json) => {
      data = json;
      fillText();
      draw();
      let frame;
      new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); })
        .observe(document.querySelector('.page'));
    })
    .catch(() => { document.getElementById('load-error').hidden = false; });
})();
