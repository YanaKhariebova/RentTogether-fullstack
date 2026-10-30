// Apply the saved choice before the app paints, including when storage is blocked.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem('renttogether-theme') === 'dark' ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}
