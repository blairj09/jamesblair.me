(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const pollId = params.get('poll');
  const presenting = params.get('present') === '1';
  const idPattern = /^[a-f0-9]{24}$/;
  let poll;
  let timer;
  let failures = 0;
  let busy = false;
  let selected;
  let chartRows = [];
  let answerCount = 0;
  let hostToken = '';
  let voter = '';
  let stopped = false;
  let readVersion = 0;
  let storageAvailable = true;
  let saved = [];

  function message(text) {
    $('message').textContent = text;
    $('message').hidden = !text;
  }

  try {
    saved = JSON.parse(localStorage.getItem('stat121-polls') || '[]');
    if (!Array.isArray(saved)) saved = [];
    saved = saved.filter(p => p && idPattern.test(p.id) && typeof p.hostToken === 'string' &&
      typeof p.question === 'string' && Date.parse(p.expiresAt) > Date.now());
    voter = localStorage.getItem('stat121-voter') || crypto.randomUUID();
    localStorage.setItem('stat121-voter', voter);
  } catch {
    storageAvailable = false;
    voter = crypto.randomUUID();
    message('Allow browser storage to keep your vote and instructor access when you reload.');
  }
  hostToken = saved.find(p => p.id === pollId)?.hostToken || '';

  function studentUrl(id) {
    return new URL(`/stat-121/polls/?poll=${id}`, location.origin).href;
  }

  async function request(method, body, id = pollId, adminKey = '') {
    const headers = { 'Content-Type': 'application/json' };
    if (hostToken && !presenting) headers['X-Poll-Host'] = hostToken;
    if (!presenting) headers['X-Poll-Voter'] = voter;
    if (adminKey) headers['X-Poll-Admin'] = adminKey;
    const response = await fetch(`/api/polls${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', signal: AbortSignal.timeout(10000)
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('The poll connection is unavailable. Please try again.'); }
    if (!response.ok) {
      const error = new Error(result.error || 'Please try again.');
      error.status = response.status;
      error.code = result.code;
      throw error;
    }
    return result;
  }

  function addAnswer(value = '') {
    if (answerCount >= 6) return;
    const row = document.createElement('div');
    row.className = 'answer-row';
    const letter = document.createElement('span');
    letter.className = 'choice-letter';
    letter.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input');
    input.type = 'text';
    input.required = true;
    input.maxLength = 120;
    input.value = value;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      row.remove();
      answerCount--;
      labelAnswers();
    });
    row.append(letter, input, remove);
    $('answer-fields').append(row);
    answerCount++;
    labelAnswers();
  }

  function labelAnswers() {
    [...$('answer-fields').querySelectorAll('.answer-row')].forEach((row, i) => {
      const letter = String.fromCharCode(65 + i);
      row.querySelector('span').textContent = letter;
      row.querySelector('input').setAttribute('aria-label', `Answer ${letter}`);
      row.querySelector('input').placeholder = `Answer ${letter}`;
      row.querySelector('button').setAttribute('aria-label', `Remove answer ${letter}`);
      row.querySelector('button').hidden = answerCount <= 2;
    });
    $('add-answer').hidden = answerCount >= 6;
  }

  function buildPoll(next) {
    $('landing').hidden = true;
    $('poll-view').hidden = false;
    document.body.classList.toggle('host', next.host && !presenting);
    document.body.classList.toggle('present', presenting);
    $('poll-question').textContent = next.question;
    document.title = `${next.question} | STAT 121 Poll`;
    const choices = $('vote-options');
    choices.querySelectorAll('label').forEach(el => el.remove());
    const chart = $('chart');
    chart.replaceChildren();
    chartRows = next.options.map((option, i) => {
      const label = document.createElement('label');
      label.className = 'vote-choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = i;
      radio.required = true;
      radio.addEventListener('change', () => { selected = i; });
      const text = document.createElement('span');
      text.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
      label.append(radio, text);
      choices.append(label);
      const row = document.createElement('div');
      row.className = 'chart-row';
      const heading = document.createElement('div');
      heading.className = 'chart-label';
      const name = document.createElement('span');
      name.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
      const count = document.createElement('span');
      heading.append(name, count);
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = '0%';
      track.append(fill);
      row.append(heading, track);
      chart.append(row);
      return { count, fill };
    });
    $('join-panel').hidden = !(next.host || presenting);
    $('host-controls').hidden = !next.host || presenting;
    $('present-controls').hidden = !presenting;
    $('vote-panel').hidden = next.host || presenting;
    if (next.host || presenting) {
      const link = studentUrl(next.id);
      $('student-link').href = link;
      $('student-link').textContent = link.replace(/^https?:\/\//, '');
      $('present-link').href = `${link}&present=1`;
      if (typeof qrcode === 'function') {
        const qr = qrcode(0, 'M');
        qr.addData(link);
        qr.make();
        // Markup is generated entirely by the bundled QR library, not poll text.
        $('qr-code').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
      } else {
        $('qr-code').textContent = 'QR code unavailable. Share the link below.';
      }
    }
  }

  function render(next) {
    if (!poll) buildPoll(next);
    poll = next;
    $('poll-status').textContent = next.open ? 'Voting open' : 'Voting closed';
    $('poll-status').classList.toggle('closed', !next.open);
    $('response-count').textContent = `${next.total} ${next.total === 1 ? 'response' : 'responses'}`;
    $('live-label').textContent = next.open ? 'Live' : 'Final';
    $('hidden-results').hidden = next.revealed;
    $('chart').hidden = !next.revealed;
    if (next.revealed && next.counts) {
      next.counts.forEach((count, i) => {
        const percentage = next.total ? Math.round(count / next.total * 100) : 0;
        chartRows[i].count.textContent = `${count} · ${percentage}%`;
        chartRows[i].fill.style.width = `${percentage}%`;
      });
    }
    $('toggle-open').textContent = next.open ? 'Close voting' : 'Reopen voting';
    $('toggle-results').textContent = next.revealed ? 'Hide results' : 'Reveal results';
    const voted = Number.isInteger(next.vote);
    $('vote-options').disabled = voted || !next.open || busy;
    $('vote-button').disabled = voted || !next.open || busy;
    $('vote-button').textContent = voted ? 'Vote submitted' : next.open ? 'Submit vote' : 'Voting is closed';
    $('vote-confirmation').hidden = !voted;
    if (voted) {
      $('vote-confirmation').textContent = `You voted for ${next.options[next.vote]}. Thanks for adding your voice.`;
      const radio = $('vote-options').querySelector(`input[value="${next.vote}"]`);
      if (radio) radio.checked = true;
    }
    $('vote-instruction').textContent = voted ? 'Your response has been counted.' : next.open ?
      'Choose one answer, then submit your vote.' : 'Your instructor has closed voting for this poll.';
    $('connection').textContent = 'Connected · Results refresh every 2 seconds';
  }

  async function refresh() {
    clearTimeout(timer);
    if (stopped || document.hidden || busy) return;
    const version = ++readVersion;
    try {
      const next = await request('GET');
      if (version !== readVersion || busy) return;
      render(next);
      if (failures) message('');
      failures = 0;
    } catch (error) {
      if (version !== readVersion || busy) return;
      failures++;
      $('connection').textContent = 'Connection interrupted · Reconnecting…';
      message(error.code === 'SETUP_REQUIRED' ?
        'Live polls need a one-time setup. See the polls README for storage and instructor-key instructions.' : error.message);
      // Disable voting against stale state while preserving already displayed results.
      $('vote-button').disabled = true;
      if ([400, 404].includes(error.status) || error.code === 'SETUP_REQUIRED') stopped = true;
    }
    if (!stopped) timer = setTimeout(refresh, Math.min(2000 * (2 ** Math.min(failures, 4)), 30000));
  }

  async function control(change) {
    if (busy || !poll) return;
    busy = true;
    readVersion++;
    clearTimeout(timer);
    $('toggle-open').disabled = $('toggle-results').disabled = true;
    try { render(await request('PATCH', change)); message(''); }
    catch (error) { message(error.message); }
    finally {
      busy = false;
      $('toggle-open').disabled = $('toggle-results').disabled = false;
      refresh();
    }
  }

  $('add-answer').addEventListener('click', () => { addAnswer(); $('answer-fields').lastElementChild.querySelector('input').focus(); });
  addAnswer(); addAnswer(); addAnswer(); addAnswer();
  $('join-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = $('join-link').value.trim();
    let id = value;
    try { id = new URL(value, location.origin).searchParams.get('poll') || value; } catch { /* Validate below. */ }
    if (!idPattern.test(id)) { message('Paste the complete poll link provided by your instructor.'); return; }
    location.assign(studentUrl(id));
  });
  $('create-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!storageAvailable) {
      message('Enable browser storage before creating a poll so your instructor controls can be saved.');
      return;
    }
    $('create-button').disabled = true;
    $('create-button').textContent = 'Creating…';
    try {
      const created = await request('POST', {
        action: 'create', question: $('question').value,
        options: [...$('answer-fields').querySelectorAll('input')].map(input => input.value)
      }, null, $('admin-key').value);
      saved.unshift({ id: created.id, question: created.question, hostToken: created.hostToken, expiresAt: created.expiresAt });
      localStorage.setItem('stat121-polls', JSON.stringify(saved.slice(0, 30)));
      $('admin-key').value = '';
      location.assign(studentUrl(created.id));
    } catch (error) {
      message(error.code === 'SETUP_REQUIRED' ?
        'Live polls need a one-time setup. See the polls README for storage and instructor-key instructions.' : error.message);
      $('create-button').disabled = false;
      $('create-button').textContent = 'Create poll →';
    }
  });
  $('vote-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !poll?.open || Number.isInteger(poll.vote) || !Number.isInteger(selected)) return;
    busy = true;
    readVersion++;
    clearTimeout(timer);
    $('vote-button').disabled = true;
    try {
      await request('POST', { option: selected });
      message('');
    } catch (error) { message(error.message); }
    finally { busy = false; refresh(); }
  });
  $('toggle-open').addEventListener('click', () => control({ open: !poll.open }));
  $('toggle-results').addEventListener('click', () => control({ revealed: !poll.revealed }));
  $('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(studentUrl(pollId));
      $('copy-link').textContent = 'Link copied';
      setTimeout(() => { $('copy-link').textContent = 'Copy student link'; }, 2000);
    } catch { message('Select and copy the student link below the QR code.'); }
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { message('Use your browser’s full-screen command to enlarge the projector view.'); }
  });
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden && pollId && !stopped) refresh();
  });
  if (pollId) {
    if (!idPattern.test(pollId)) { message('This poll link is invalid. Ask your instructor for the QR code.'); }
    else { $('landing').hidden = true; refresh(); }
  } else if (saved.length) {
    $('recent').hidden = false;
    saved.forEach(p => {
      const link = document.createElement('a');
      link.href = studentUrl(p.id);
      link.textContent = p.question;
      $('recent-list').append(link);
    });
  }
})();
