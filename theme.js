// Apply the stored choice before styles render; storage may be unavailable.
(() => {
    document.documentElement.classList.add('js');
    let saved;
    try { saved = localStorage.getItem('theme'); } catch { /* Use the system preference. */ }
    const theme = saved === 'light' || saved === 'dark'
        ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
})();
