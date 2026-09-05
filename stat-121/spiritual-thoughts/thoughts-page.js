const thoughtsContainer = document.getElementById('thoughts');
const searchInput = document.getElementById('search');
const emptyState = document.getElementById('empty');
const reader = document.getElementById('thought-reader');
const readerContent = document.getElementById('reader-content');
const closeReader = document.getElementById('close-reader');
let opener;

const thoughts = [...spiritualThoughts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const showAllThoughts = document.documentElement.dataset.thoughtsMode === 'all';

function currentMountainDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

const availableThoughts = showAllThoughts
  ? thoughts
  : thoughts.filter((thought) => !thought.date || thought.date <= currentMountainDate());

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function appendMarkedText(element, value) {
  for (const part of value.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g)) {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link[2];
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      anchor.textContent = link[1];
      element.append(anchor);
    } else if (part.startsWith('**') && part.endsWith('**')) {
      const bold = document.createElement('strong');
      bold.className = 'user-bold';
      bold.textContent = part.slice(2, -2);
      element.append(bold);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      const emphasis = document.createElement('em');
      emphasis.textContent = part.slice(1, -1);
      element.append(emphasis);
    } else {
      element.append(document.createTextNode(part));
    }
  }
}

function appendSection(container, section) {
  const parts = section.split(/(\{[^{}]+\})/g);

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part.trim()) continue;

    const isQuote = part.startsWith('{') && part.endsWith('}');
    const text = document.createElement(isQuote ? 'blockquote' : 'p');
    if (isQuote) text.append('“');
    appendMarkedText(text, isQuote ? part.slice(1, -1) : part);
    if (isQuote) {
      text.append('”');
      const followingPunctuation = parts[index + 1]?.match(/^\s*[,.;:!?]+/);
      if (followingPunctuation) {
        text.append(followingPunctuation[0].trim());
        parts[index + 1] = parts[index + 1].slice(followingPunctuation[0].length);
      }
    }
    container.append(text);
  }
}

function createThought(thought, isReader = false) {
  const article = document.createElement('article');
  article.className = isReader ? 'reader-thought' : 'thought-card';
  const content = isReader ? document.createElement('div') : article;
  if (isReader) content.className = 'reader-copy';

  if (thought.image) {
    const image = document.createElement('img');
    image.className = 'thought-image';
    image.src = `${document.documentElement.dataset.thoughtsAssetBase || ''}${thought.image}`;
    image.alt = thought.imageAlt || '';
    image.loading = 'lazy';
    article.append(image);
  }

  const metadata = document.createElement('p');
  metadata.className = 'thought-date';
  metadata.textContent = formatDate(thought.date) || 'Spiritual thought';
  content.append(metadata);

  const reference = document.createElement('h3');
  if (thought.sourceUrl && isReader) {
    const source = document.createElement('a');
    source.href = thought.sourceUrl;
    source.target = '_blank';
    source.rel = 'noreferrer';
    source.textContent = thought.reference;
    reference.append(source);
  } else {
    reference.textContent = thought.reference;
  }
  content.append(reference);

  if (thought.sourceUrl && isReader) {
    const sourceNote = document.createElement('p');
    sourceNote.className = 'source-note';
    sourceNote.textContent = thought.sourceLabel || 'Source';
    content.append(sourceNote);
  }

  if (isReader && thought.note) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = thought.note;
    content.append(note);
  }

  if (isReader && thought.sections?.length) {
    const body = document.createElement('div');
    body.className = 'thought-body';
    for (const section of thought.sections) {
      appendSection(body, section);
    }
    content.append(body);
  }

  if (isReader) article.append(content);

  if (!isReader) {
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Read ${thought.reference} full screen`);
    article.addEventListener('click', () => openReader(thought, article));
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openReader(thought, article);
      }
    });
  }

  return article;
}

function openReader(thought, card) {
  opener = card;
  readerContent.replaceChildren(createThought(thought, true));
  reader.showModal();
  closeReader.focus();
}

function closeReaderView() {
  reader.close();
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const matchingThoughts = availableThoughts.filter((thought) =>
    [thought.reference, thought.note, ...(thought.sections || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );

  thoughtsContainer.replaceChildren(...matchingThoughts.map((thought) => createThought(thought)));
  emptyState.hidden = matchingThoughts.length > 0;

  if (!emptyState.hidden) {
    const heading = emptyState.querySelector('h2');
    const detail = emptyState.querySelector('p:last-child');
    if (query) {
      emptyState.querySelector('.eyebrow').textContent = 'Try again';
      heading.textContent = 'No thoughts match that search.';
      detail.textContent = 'Try a different word, or clear the search to see every thought.';
    } else {
      emptyState.querySelector('.eyebrow').textContent = 'More to come';
      heading.textContent = 'No thoughts have been shared yet.';
      detail.textContent = 'Check back after our next class.';
    }
  }
}

searchInput.addEventListener('input', render);
closeReader.addEventListener('click', closeReaderView);
reader.addEventListener('click', (event) => {
  if (event.target === reader) closeReaderView();
});
reader.addEventListener('close', () => opener?.focus());
render();
