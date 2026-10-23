// Vercel Web Analytics for the site's static HTML pages.
window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
};

// The Analytics endpoint is provided by Vercel after enabling Web Analytics.
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && location.hostname !== '[::1]') {
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    document.head.appendChild(script);
}
