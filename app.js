const sections = [...document.querySelectorAll('main section[id][data-title]')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const tocLinks = [...document.querySelectorAll('.page-toc nav a')];
const currentPage = document.querySelector('#current-page');
const sidebar = document.querySelector('#sidebar');
const menuButton = document.querySelector('#menu-button');
const searchOverlay = document.querySelector('#search-overlay');
const searchButton = document.querySelector('#search-button');
const searchClose = document.querySelector('#search-close');
const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const themeToggle = document.querySelector('#theme-toggle');
let previousFocus = null;

function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggle.querySelector('span').textContent = dark ? '☀' : '☾';
}
updateThemeButton();
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('avenoxtab-theme', next); } catch {}
  updateThemeButton();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  try { if (localStorage.getItem('avenoxtab-theme')) return; } catch { return; }
  document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  updateThemeButton();
});

function activateSection(id) {
  const section = sections.find(item => item.id === id);
  if (!section) return;
  currentPage.textContent = section.dataset.title;
  navLinks.forEach(link => {
    const active = link.hash === '#' + id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  tocLinks.forEach(link => {
    const active = link.hash === '#' + id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function closeMenu() {
  sidebar.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navLinks.forEach(link => link.addEventListener('click', () => {
  closeMenu();
  activateSection(link.hash.slice(1));
}));
document.addEventListener('click', event => {
  if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
window.addEventListener('hashchange', () => activateSection(location.hash.slice(1)));
if (location.hash) activateSection(location.hash.slice(1));
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
  if (visible.length) activateSection(visible[0].target.id);
}, {rootMargin: '-90px 0px -65% 0px', threshold: 0});
sections.forEach(section => observer.observe(section));

function renderSearch(query) {
  const normalized = query.trim().toLowerCase();
  const matches = sections.filter(section => !normalized || (section.dataset.title + ' ' + section.textContent).toLowerCase().includes(normalized));
  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.textContent = 'No results. Try a command, texture, or configuration key.';
    searchResults.append(empty);
    return;
  }
  matches.forEach(section => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'result';
    const icon = document.createElement('span');
    icon.textContent = '↗';
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = section.dataset.title;
    const description = document.createElement('small');
    description.textContent = section.querySelector('.section-intro, .hero-lead')?.textContent || '';
    copy.append(title, description);
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    button.append(icon, copy, arrow);
    button.addEventListener('click', () => {
      closeSearch();
      location.hash = section.id;
      section.scrollIntoView({behavior: 'smooth'});
      activateSection(section.id);
    });
    searchResults.append(button);
  });
}
function openSearch() {
  previousFocus = document.activeElement;
  searchOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  searchInput.value = '';
  renderSearch('');
  searchInput.focus();
}
function closeSearch() {
  if (searchOverlay.hidden) return;
  searchOverlay.hidden = true;
  document.body.style.overflow = '';
  previousFocus?.focus();
}
searchButton.addEventListener('click', openSearch);
searchClose.addEventListener('click', closeSearch);
searchInput.addEventListener('input', () => renderSearch(searchInput.value));
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') searchResults.querySelector('.result')?.click();
});
searchOverlay.addEventListener('click', event => {
  if (event.target === searchOverlay) closeSearch();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (searchOverlay.hidden) openSearch();
    else closeSearch();
  }
  if (event.key === 'Escape') {
    closeSearch();
    closeMenu();
  }
  if (!searchOverlay.hidden && event.key === 'Tab') {
    const controls = [searchInput, searchClose, ...searchResults.querySelectorAll('button')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy);
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.textContent);
      button.textContent = 'Copied!';
      window.setTimeout(() => { button.textContent = 'Copy code'; }, 1800);
    } catch {
      button.textContent = 'Select code to copy';
      window.setTimeout(() => { button.textContent = 'Copy code'; }, 2200);
    }
  });
});

