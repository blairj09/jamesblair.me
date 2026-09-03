/*
 * SEMESTER CONFIGURATION
 * Update these values before presenting a new class. The matching text in the
 * deck updates automatically; no HTML edits are needed for routine changes.
 */
const INTRO_CONFIG = {
  courseCode: 'STAT 121',
  courseSubtitle: 'Introduction to Statistical Data Analysis',
  courseName: 'STAT 121: Introduction to Statistical Data Analysis',
  term: 'Fall 2026',
  meeting: 'Tuesdays & Thursdays · 5:30–6:45 PM',
  room: '1102 JKB',
  officeHours: 'Wednesdays · 1:00–2:30 PM',
  courseLink: '../stat-121/',
  courseLinkLabel: 'Open course resources'
};

const slides = [...document.querySelectorAll('.slide')];
const previousButton = document.querySelector('[data-direction="previous"]');
const nextButton = document.querySelector('[data-direction="next"]');
const nextButtonLabel = nextButton.querySelector('span');
const counter = document.querySelector('.slide-counter');
const progress = document.querySelector('.progress span');
const familySlide = document.querySelector('#family');
const familySlideshowImage = document.querySelector('#family-slideshow-image');
const familySlideshowFrame = document.querySelector('.family-photo');
const beyondSlide = document.querySelector('#beyond');
const bikeSlideshowImage = document.querySelector('#bike-slideshow-image');
const bikeSlideshowFrame = document.querySelector('.cycling-photo');
const togetherSlide = document.querySelector('#together');
const daughterQuote = document.querySelector('#daughter-quote');
const togetherMessage = document.querySelector('#together-message');
const familyPhotos = [
  { src: '../images/intro-family-waterfall.jpg', alt: 'James, Brittany, and their five children together at a waterfall', ratio: '3 / 4' },
  { src: '../images/intro-family-lake.jpg', alt: 'Four of James’s children playing in a lake at sunset', ratio: '3 / 4' },
  { src: '../images/my-family.jpg', alt: 'James, Brittany, and their children together outdoors', ratio: '559 / 800' },
  { src: '../images/intro-couple-redwoods.jpg', alt: 'James and Brittany smiling together on a forest hike', ratio: '4 / 3' }
];
const bikePhotos = [
  { src: '../images/cycling.jpeg', alt: 'James cycling outdoors', ratio: '3 / 2' },
  { src: '../images/intro-cycling-mountains.jpg', alt: 'James on a mountain bike ride with a mountain view behind him', ratio: '4 / 3' }
];
let activeIndex = 0;
let pointerStartX = null;
let familyPhotoIndex = 0;
let bikePhotoIndex = 0;

function applyConfig() {
  document.querySelectorAll('[data-config]').forEach((element) => {
    const value = INTRO_CONFIG[element.dataset.config];
    if (typeof value === 'string') element.textContent = value;
  });
  document.querySelectorAll('[data-config-href]').forEach((element) => {
    const value = INTRO_CONFIG[element.dataset.configHref];
    if (typeof value === 'string' && value) element.href = value;
  });
}

function indexFromHash() {
  const name = decodeURIComponent(window.location.hash.slice(1));
  const index = slides.findIndex((slide) => slide.id === name);
  return index >= 0 ? index : 0;
}

function showSlide(index, { updateHash = true, focus = false } = {}) {
  activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeIndex;
    slide.hidden = !isActive;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });
  const slide = slides[activeIndex];
  document.title = `${slide.dataset.title} | James Blair`;
  counter.textContent = `${activeIndex + 1} / ${slides.length}`;
  progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
  previousButton.disabled = activeIndex === 0;
  setTogetherMessage();
  updateNextButton();
  if (updateHash && window.location.hash !== `#${slide.id}`) {
    window.history.pushState(null, '', `#${encodeURIComponent(slide.id)}`);
  }
  if (focus) slide.querySelector('h1, h2')?.focus?.();
}

function setTogetherMessage() {
  if (!togetherSlide || !daughterQuote || !togetherMessage) return;

  togetherSlide.classList.remove('is-revealed');
  daughterQuote.setAttribute('aria-hidden', 'false');
  togetherMessage.setAttribute('aria-hidden', 'true');
}

function updateNextButton() {
  const isFinalSlide = activeIndex === slides.length - 1;
  const awaitingReveal = slides[activeIndex] === togetherSlide && !togetherSlide.classList.contains('is-revealed');
  nextButton.disabled = isFinalSlide;
  nextButtonLabel.textContent = awaitingReveal ? 'Reveal' : 'Next';
}

function revealTogetherMessage() {
  togetherSlide.classList.add('is-revealed');
  daughterQuote.setAttribute('aria-hidden', 'true');
  togetherMessage.setAttribute('aria-hidden', 'false');
  updateNextButton();
}

function move(direction) {
  if (direction > 0 && slides[activeIndex] === togetherSlide && !togetherSlide.classList.contains('is-revealed')) {
    revealTogetherMessage();
    return;
  }
  if (direction > 0 && activeIndex === slides.length - 1) {
    return;
  }
  showSlide(activeIndex + direction);
}

function showNextFamilyPhoto() {
  if (!familySlide || familySlide.hidden || document.hidden || !familySlideshowImage) return;

  familyPhotoIndex = (familyPhotoIndex + 1) % familyPhotos.length;
  const photo = familyPhotos[familyPhotoIndex];
  familySlideshowImage.classList.add('is-changing');
  familySlideshowFrame?.style.setProperty('--photo-ratio', photo.ratio);

  window.setTimeout(() => {
    familySlideshowImage.src = photo.src;
    familySlideshowImage.alt = photo.alt;
    familySlideshowImage.classList.remove('is-changing');
  }, 180);
}

function showNextBikePhoto() {
  if (!beyondSlide || beyondSlide.hidden || document.hidden || !bikeSlideshowImage) return;

  bikePhotoIndex = (bikePhotoIndex + 1) % bikePhotos.length;
  const photo = bikePhotos[bikePhotoIndex];
  bikeSlideshowImage.classList.add('is-changing');
  bikeSlideshowFrame?.style.setProperty('--bike-photo-ratio', photo.ratio);

  window.setTimeout(() => {
    bikeSlideshowImage.src = photo.src;
    bikeSlideshowImage.alt = photo.alt;
    bikeSlideshowImage.classList.remove('is-changing');
  }, 180);
}

previousButton.addEventListener('click', () => move(-1));
nextButton.addEventListener('click', () => move(1));

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea, select, button, a')) return;
  if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) {
    event.preventDefault();
    move(1);
  } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    showSlide(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    showSlide(slides.length - 1);
  }
});

window.addEventListener('hashchange', () => showSlide(indexFromHash(), { updateHash: false }));

document.querySelector('.stage').addEventListener('pointerdown', (event) => {
  pointerStartX = event.clientX;
});
document.querySelector('.stage').addEventListener('pointerup', (event) => {
  if (pointerStartX === null) return;
  const distance = event.clientX - pointerStartX;
  pointerStartX = null;
  if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
});
document.querySelector('.stage').addEventListener('pointercancel', () => { pointerStartX = null; });

applyConfig();
showSlide(indexFromHash(), { updateHash: !window.location.hash });
window.setInterval(showNextFamilyPhoto, 5000);
window.setInterval(showNextBikePhoto, 5000);
