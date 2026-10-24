// Shared navigation, theme, and analytics for the public site shell.
document.addEventListener('DOMContentLoaded', () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-QPZMEL1FKS');

    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    const closeMenu = () => {
        menu?.classList.remove('active');
        toggle?.setAttribute('aria-expanded', 'false');
    };
    toggle?.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        menu.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
    });
    menu?.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu?.classList.contains('active')) {
            closeMenu();
            toggle.focus();
        }
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-container')) closeMenu();
    });
    matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

    const themeToggle = document.querySelector('.theme-toggle');
    const systemTheme = matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (theme) => {
        const dark = theme === 'dark';
        document.documentElement.dataset.theme = theme;
        themeToggle?.setAttribute('aria-pressed', String(dark));
        themeToggle?.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    };
    applyTheme(document.documentElement.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
    themeToggle?.addEventListener('click', () => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
        try { localStorage.setItem('theme', theme); } catch { /* The control still works in this tab. */ }
    });
    systemTheme.addEventListener('change', (event) => {
        let saved;
        try { saved = localStorage.getItem('theme'); } catch { /* Follow the system. */ }
        if (!saved) applyTheme(event.matches ? 'dark' : 'light');
    });
});

// Manual carousel: no autoplay, and native scrolling remains available without JS.
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('project-carousel');
    if (!track) return;
    const slides = [...track.querySelectorAll('.project-slide')];
    const previous = document.getElementById('project-previous');
    const next = document.getElementById('project-next');
    const status = document.getElementById('project-position');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let frame;

    const position = (index) => slides[index].offsetLeft - slides[0].offsetLeft;
    const update = () => {
        const closest = slides.reduce((best, slide, index) =>
            Math.abs(position(index) - track.scrollLeft) < Math.abs(position(best) - track.scrollLeft) ? index : best, 0);
        active = closest;
        previous.disabled = active === 0;
        next.disabled = active === slides.length - 1;
        const label = `${active + 1} / ${slides.length} — ${slides[active].querySelector('h3').textContent.trim()}`;
        if (status.textContent !== label) status.textContent = label;
        slides.forEach((slide, index) => { slide.inert = index !== active; });
    };
    const goTo = (index) => {
        active = Math.max(0, Math.min(slides.length - 1, index));
        track.scrollTo({ left: position(active), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    previous.addEventListener('click', () => goTo(active - 1));
    next.addEventListener('click', () => goTo(active + 1));
    track.addEventListener('keydown', (event) => {
        if (event.target !== track) return;
        const destinations = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        goTo(destinations[event.key]);
    });
    track.addEventListener('scroll', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
    }, { passive: true });
    new ResizeObserver(() => {
        track.scrollTo({ left: position(active), behavior: 'instant' });
        update();
    }).observe(track);
    document.querySelector('.carousel-controls').hidden = false;
    update();
});
