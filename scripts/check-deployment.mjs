// Read-only public checks. Does not authenticate, upload, seed or mutate data.
const [frontendArg, apiArg] = process.argv.slice(2);
if (!frontendArg || !apiArg || process.argv.length !== 4) {
  console.error('Usage: node scripts/check-deployment.mjs https://FRONTEND https://API/api');
  process.exit(1);
}
function publicHttpsUrl(value, label) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be an HTTPS URL without credentials, query or fragment.`);
  }
  return url;
}
try {
  const frontend = publicHttpsUrl(frontendArg, 'Frontend');
  const api = publicHttpsUrl(apiArg, 'API');
  if (frontend.pathname !== '/' || api.pathname.replace(/\/$/, '') !== '/api') {
    throw new Error('Use the frontend origin and the API URL ending in /api.');
  }
  async function get(url, headers = {}) {
    // Allow the free backend time to wake up after inactivity.
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Public endpoint returned HTTP ${response.status}.`);
    return response;
  }
  const home = await get(frontend);
  if (!home.headers.get('content-type')?.includes('text/html')) {
    throw new Error('Frontend did not return HTML.');
  }
  const homeHtml = await home.text();
  const deep = await get(new URL('/hilfe', frontend));
  if (
    !deep.headers.get('content-type')?.includes('text/html') ||
    (await deep.text()) !== homeHtml
  ) {
    throw new Error('SPA fallback failed: a direct /hilfe request must return the app HTML.');
  }
  console.log('Frontend HTTPS and SPA fallback passed.');
  const base = api.href.replace(/\/$/, '');
  const health = await get(`${base}/health`);
  if ((await health.json()).status !== 'ok') throw new Error('Health response is unexpected.');
  console.log('API health passed.');
  const categories = await get(`${base}/categories`, { Origin: frontend.origin });
  if (categories.headers.get('access-control-allow-origin') !== frontend.origin) {
    throw new Error('CORS does not match the frontend origin. Check CLIENT_URL.');
  }
  const categoryBody = await categories.json();
  if (!Array.isArray(categoryBody.categories) || categoryBody.categories.length === 0) {
    throw new Error('No categories: check database migration and seed.');
  }
  console.log('Database categories and CORS passed.');
  const items = await get(`${base}/items?page=1&limit=1`);
  if (!Array.isArray((await items.json()).items))
    throw new Error('Catalog response is unexpected.');
  console.log('Public catalog passed.');
  console.log('Next: verify sign-in, image upload and booking with two accounts in a browser.');
} catch (error) {
  // Do not echo connection strings, response bodies or secret environment values.
  console.error(error instanceof Error ? error.message : 'Deployment check failed.');
  process.exitCode = 1;
}
