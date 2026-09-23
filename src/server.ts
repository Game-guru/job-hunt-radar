/*
 * WEB SERVER - v2
 * ===============
 *
 * Until now your app only talked to you through the terminal. This file makes
 * it talk to a browser instead.
 *
 * Start it with:   npm start
 * Then open:       http://localhost:3000
 *
 * WHAT A SERVER ACTUALLY IS
 * -------------------------
 * A program that sits waiting. A browser sends it a request ("give me the
 * jobs"), it sends a response back. That is genuinely the whole idea.
 *
 * "localhost" means this computer. Nothing here is on the internet - only you
 * can reach it. Putting it online is v3.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { getAllJobs, updateStatus, getStatusCounts } from './db.ts';

const PORT = 3000;

// The folder holding the files the browser downloads: HTML, CSS, JavaScript.
// import.meta.dirname is the folder this file lives in, so the path works
// no matter which directory you run npm start from.
const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');

// ---------------------------------------------------------------------------
// 1. CONTENT TYPES
// ---------------------------------------------------------------------------
// When the server sends a file it must say what kind of file it is.
// Get this wrong and the browser shows your HTML as plain text, or ignores
// your stylesheet entirely.

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

// ---------------------------------------------------------------------------
// 2. SMALL HELPERS
// ---------------------------------------------------------------------------
// Sending JSON always needs the same three steps, so we wrap them up once.
// statusCode is the HTTP result code: 200 = fine, 400 = you sent nonsense,
// 404 = no such thing, 500 = the server broke.

function sendJson(res: any, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

// A browser sends the body of a POST request in pieces, not all at once.
// This waits for all the pieces, sticks them together, and parses the JSON.
async function readJsonBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

// ---------------------------------------------------------------------------
// 3. THE SERVER
// ---------------------------------------------------------------------------
// This function runs once for EVERY request the browser makes. Loading the
// page might trigger four: the HTML, the CSS, the JavaScript, the job data.
//
// req = what the browser asked for.  res = what we send back.

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  try {
    // -- ROUTE 1: the job data, as JSON -----------------------------------
    // This is an API endpoint. It returns data, not a page. The browser's
    // JavaScript calls this and decides what to do with the result.
    if (url === '/api/jobs' && method === 'GET') {
      sendJson(res, 200, {
        jobs: getAllJobs(),
        counts: getStatusCounts(),
      });
      return;
    }

    // -- ROUTE 2: change a job's status -----------------------------------
    // POST means "this request changes something", as opposed to GET which
    // only reads. Clicking "Applied" on the page sends one of these.
    if (url === '/api/status' && method === 'POST') {
      const body = await readJsonBody(req);

      // Never assume the incoming data is the right shape. A browser can
      // send anything at all, including nothing.
      if (typeof body.link !== 'string' || typeof body.status !== 'string') {
        sendJson(res, 400, { error: 'Expected { link: string, status: string }' });
        return;
      }

      try {
        const updated = updateStatus(body.link, body.status);
        if (!updated) {
          sendJson(res, 404, { error: 'No job with that link' });
          return;
        }
        sendJson(res, 200, { ok: true, counts: getStatusCounts() });
      } catch (error) {
        // updateStatus throws if the status is not one we allow.
        sendJson(res, 400, { error: (error as Error).message });
      }
      return;
    }

    // -- ROUTE 3: static files --------------------------------------------
    // Anything else is a request for a file: the page, the stylesheet, etc.
    // '/' means the browser wants the home page, which is index.html.
    const fileName = url === '/' ? 'index.html' : url;

    // SECURITY: a request for '/../../secrets.txt' would otherwise escape
    // the public folder and read anything on your disk. That attack is
    // called path traversal. Refusing '..' outright is the simple defence.
    if (fileName.includes('..')) {
      sendJson(res, 400, { error: 'Bad path' });
      return;
    }

    const filePath = join(PUBLIC_DIR, fileName);
    const contentType = CONTENT_TYPES[extname(filePath)] ?? 'text/plain; charset=utf-8';

    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      // readFile throws if the file does not exist. That is a 404.
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  } catch (error) {
    // A catch-all. Without this, one unexpected error kills the whole server
    // and every future request fails too.
    console.error('Server error:', error);
    sendJson(res, 500, { error: 'Something went wrong on the server' });
  }
});

// ---------------------------------------------------------------------------
// 4. START LISTENING
// ---------------------------------------------------------------------------
// Unlike your scraper, this does not finish. It waits for requests until you
// stop it with Ctrl+C. That is what "running a server" means.

server.listen(PORT, () => {
  console.log('');
  console.log('  Job Hunt Radar is running');
  console.log(`  -> http://localhost:${PORT}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});

// ---------------------------------------------------------------------------
// YOUR EXERCISES - v2
// ---------------------------------------------------------------------------
//
// 1. Start the server, then visit http://localhost:3000/api/jobs directly in
//    your browser. You will see raw JSON. That is exactly what the page's
//    JavaScript receives - there is nothing magic in between.
//
// 2. Visit http://localhost:3000/nonsense. You get your own 404 message.
//
// 3. Add an endpoint GET /api/stats that returns only the counts.
//    Copy the shape of ROUTE 1.
//
// 4. Try to break your own validation: what happens if you send a status of
//    "banana"? (You can test with the browser console:
//       fetch('/api/status', { method:'POST',
//         headers:{'Content-Type':'application/json'},
//         body: JSON.stringify({ link:'x', status:'banana' }) })
//    ) It should be refused with a 400. That refusal is the server not
//    trusting the browser - which it never should.
