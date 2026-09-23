/* ===========================================================================
   THE PAGE'S BRAIN - v2

   This runs inside the browser, not in Node. It has no database access and
   no filesystem. Everything it knows, it asked the server for.

   The cycle never changes:
       1. ask the server for data
       2. build HTML from that data
       3. when the user clicks, tell the server
       4. rebuild the HTML
   =========================================================================== */

// ---------------------------------------------------------------------------
// 1. STATE
// ---------------------------------------------------------------------------
// "State" means: everything the page currently knows. Every time it changes
// we redraw. Keeping it all in one place is what stops the page and the data
// drifting apart.

let allJobs = [];          // every job from the server
let activeFilter = 'all';  // which filter button is selected
let searchText = '';       // what is typed in the search box

const STATUSES = ['new', 'applied', 'interviewing', 'rejected'];

// ---------------------------------------------------------------------------
// 2. GRABBING THE ELEMENTS
// ---------------------------------------------------------------------------
// The HTML already exists. querySelector finds an element using the same
// selector syntax you learned in Playwright - '#job-list' means "the element
// with id job-list". Same language, different tool.

const listEl = document.querySelector('#job-list');
const statsEl = document.querySelector('#stats');
const searchEl = document.querySelector('#search');
const emptyEl = document.querySelector('#empty-message');

// ---------------------------------------------------------------------------
// 3. TALKING TO THE SERVER
// ---------------------------------------------------------------------------
// fetch() sends an HTTP request, exactly like typing a URL into the address
// bar - except JavaScript gets the answer instead of the screen.
//
// It is slow (it crosses a network), so it is async and needs await.
// Same await you already met in Playwright.

async function loadJobs() {
  const response = await fetch('/api/jobs');

  // A response can arrive and still be a failure - 404, 500 and so on.
  // response.ok is true only for success codes.
  if (!response.ok) {
    listEl.innerHTML = '<p class="empty">Could not reach the server.</p>';
    return;
  }

  const data = await response.json();   // turn the JSON text into objects
  allJobs = data.jobs;
  renderStats(data.counts);
  render();
}

// Tell the server a job's status changed.
async function setStatus(link, status) {
  const response = await fetch('/api/status', {
    method: 'POST',                                     // POST = I am changing something
    headers: { 'Content-Type': 'application/json' },    // warn it we are sending JSON
    body: JSON.stringify({ link, status }),             // objects must become text
  });

  if (!response.ok) {
    const error = await response.json();
    alert(`Could not update: ${error.error}`);
    return;
  }

  const data = await response.json();

  // Update our local copy so the page matches the database.
  // .find() returns the first item matching the test, or undefined.
  const job = allJobs.find((j) => j.link === link);
  if (job) job.status = status;

  renderStats(data.counts);
  render();
}

// ---------------------------------------------------------------------------
// 4. DRAWING
// ---------------------------------------------------------------------------

function renderStats(counts) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const cells = [['Total', total], ...STATUSES.map((s) => [s, counts[s] ?? 0])];

  statsEl.innerHTML = cells
    .map(([label, value]) => `
      <div class="stat">
        <span class="stat-value">${value}</span>
        <span class="stat-label">${label}</span>
      </div>
    `)
    .join('');
}

// Decide which jobs to show, based on the filter and the search box.
function visibleJobs() {
  const needle = searchText.trim().toLowerCase();

  return allJobs.filter((job) => {
    // Same .filter() you used in v0 - it works identically in the browser.
    const matchesFilter = activeFilter === 'all' || job.status === activeFilter;

    const matchesSearch =
      needle === '' ||
      job.title.toLowerCase().includes(needle) ||
      job.company.toLowerCase().includes(needle) ||
      job.location.toLowerCase().includes(needle);

    return matchesFilter && matchesSearch;   // both must be true
  });
}

// Anything typed by a user could contain HTML. If we paste it straight into
// the page, a job title containing a <script> tag would RUN. That attack is
// called XSS (cross-site scripting), and it is the front-end cousin of the
// SQL injection you saw earlier.
//
// Replacing the dangerous characters turns code back into harmless text.
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function render() {
  const jobs = visibleJobs();

  emptyEl.classList.toggle('hidden', jobs.length > 0);

  // Build one block of HTML for every job, then write it all at once.
  // Writing to innerHTML repeatedly in a loop is much slower - each write
  // makes the browser redo its layout.
  listEl.innerHTML = jobs
    .map((job) => `
      <article class="job status-${escapeHtml(job.status)}">
        <div class="job-title">
          <a href="${escapeHtml(job.link)}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a>
        </div>
        <div class="job-meta">
          ${escapeHtml(job.company)} &middot; ${escapeHtml(job.location)} &middot; posted ${escapeHtml(job.postedDate)}
        </div>
        <div class="job-actions">
          ${STATUSES.map((s) => `
            <button class="status-btn ${job.status === s ? 'current' : ''}"
                    data-link="${escapeHtml(job.link)}"
                    data-status="${s}">${s}</button>
          `).join('')}
        </div>
      </article>
    `)
    .join('');
}

// ---------------------------------------------------------------------------
// 5. REACTING TO CLICKS
// ---------------------------------------------------------------------------
// There are 400+ status buttons on this page, and render() destroys and
// rebuilds them constantly. Attaching a listener to each one would be slow,
// and any listener would die at the next render.
//
// Instead we listen ONCE on the container. Clicks bubble upward from the
// button to its parents, so the container hears every click inside it and
// we work out which button it was. This is called event delegation.

listEl.addEventListener('click', (event) => {
  const button = event.target.closest('.status-btn');
  if (!button) return;   // they clicked something else - ignore it

  setStatus(button.dataset.link, button.dataset.status);
});

document.querySelector('.filters').addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button) return;

  activeFilter = button.dataset.filter;

  // Move the "active" highlight to the clicked button.
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  button.classList.add('active');

  render();
});

searchEl.addEventListener('input', (event) => {
  searchText = event.target.value;
  render();
});

// ---------------------------------------------------------------------------
// 6. GO
// ---------------------------------------------------------------------------

loadJobs();

/* ---------------------------------------------------------------------------
   NOTICE THE ANNOYANCE - this is the point of v2
   ---------------------------------------------------------------------------

   Count how many times render() is called by hand: after loading, after a
   status change, after filtering, after typing. Forget one and the screen
   silently disagrees with the data.

   Now imagine fifty components instead of one list.

   That exact problem is why React exists. React removes the manual render()
   calls: you describe what the page should look like for a given state, and
   it works out what to redraw.

   You now know what React is FOR, because you have felt the thing it fixes.
   That is worth more than knowing its syntax.
   --------------------------------------------------------------------------- */
