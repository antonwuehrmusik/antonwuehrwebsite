(function () {
  'use strict';

  // ----- Mobile nav toggle -----
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Menü öffnen');
      });
    });
  }

  // ----- Nav shadow on scroll -----
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ----- Smooth scroll for anchor links -----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    });
  });

  // ----- Footer year -----
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ----- FAQ accordion -----
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var answer = btn.nextElementSibling;
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      document.querySelectorAll('.faq-question').forEach(function (other) {
        other.setAttribute('aria-expanded', 'false');
        other.nextElementSibling.hidden = true;
      });

      // Toggle clicked
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
      }
    });
  });

  // ----- Google Calendar events -----
  var CALENDAR_ID = 'aef32e0bf249f1a398cb06fbc16ea0f381379ac6d290a012b18f3b35bfe7bc07@group.calendar.google.com';
  var API_KEY     = 'AIzaSyCW2ZnlMpNH0gKSqc4pdJD3PiWi2s1GR9c';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createEventCard(event) {
    var start   = event.start.dateTime || event.start.date;
    var date    = new Date(start);
    var dateISO = start.slice(0, 10);

    var dateFormatted = date.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });

    var timeStr = event.start.dateTime
      ? date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
      : '';

    var location    = event.location    ? escapeHtml(event.location)    : '';
    var description = event.description ? escapeHtml(event.description) : '';
    var detail      = [timeStr, description].filter(Boolean).join(' · ');

    var article = document.createElement('article');
    article.className = 'show-card';
    article.setAttribute('role', 'listitem');
    article.innerHTML =
      '<time class="show-date" datetime="' + dateISO + '">' + dateFormatted + '</time>' +
      '<h3 class="show-venue">' + escapeHtml(event.summary || 'Auftritt') + '</h3>' +
      (location ? '<p class="show-location">' + location + '</p>' : '') +
      (detail   ? '<p class="show-detail">'   + detail   + '</p>' : '');
    return article;
  }

  function animateCards(grid) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      grid.querySelectorAll('.show-card').forEach(function (c) { io.observe(c); });
    } else {
      grid.querySelectorAll('.show-card').forEach(function (c) { c.classList.add('visible'); });
    }
  }

  function loadCalendarEvents() {
    var grid = document.getElementById('shows-grid');
    if (!grid) return;

    var now = new Date().toISOString();
    var url = 'https://www.googleapis.com/calendar/v3/calendars/'
      + encodeURIComponent(CALENDAR_ID)
      + '/events?key=' + API_KEY
      + '&timeMin=' + encodeURIComponent(now)
      + '&singleEvents=true&orderBy=startTime&maxResults=12';

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error.message);
        grid.innerHTML = '';
        if (!data.items || data.items.length === 0) {
          grid.innerHTML = '<p class="shows-empty">Aktuell sind keine bevorstehenden Auftritte eingetragen. Schauen Sie bald wieder vorbei!</p>';
          return;
        }
        data.items.forEach(function (event) {
          grid.appendChild(createEventCard(event));
        });
        animateCards(grid);
      })
      .catch(function () {
        grid.innerHTML = '<p class="shows-empty">Auftritte konnten nicht geladen werden. Bitte direkt Kontakt aufnehmen.</p>';
      });
  }

  loadCalendarEvents();

  // ----- Show card entrance animation -----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.show-card').forEach(function (card) {
      io.observe(card);
    });
  } else {
    // Fallback: make all cards visible immediately
    document.querySelectorAll('.show-card').forEach(function (card) {
      card.classList.add('visible');
    });
  }

}());
