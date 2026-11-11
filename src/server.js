import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createApp() {
  return createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;

    if (request.method === 'GET' && pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (request.method === 'GET' && pathname === '/') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ name: 'Family Tree', message: 'Welcome to the Family Tree API' }));
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found' }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`Family Tree server listening on port ${port}`);
  });
}
