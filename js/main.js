(function () {
  'use strict';

  // ----- Besetzungen dropdown -----
  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var toggle = dropdown.querySelector('.nav-dropdown-toggle');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(function (dropdown) {
      dropdown.classList.remove('is-open');
      dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
    });
  });

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

  function parseEventData(event) {
    var start   = event.start.dateTime || event.start.date;
    var date    = new Date(start);
    var dateISO = start.slice(0, 10);

    var dateFormatted = date.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });

    var rawDesc       = event.description || '';
    var isOpenEnd     = /open\s*end|ende\s*offen|end\s*offen|offen|tbd/i.test(rawDesc);
    var isTimeUnknown = /zeit\s*offen|uhrzeit\s*offen|zeit\s*unbekannt|uhrzeit\s*unbekannt/i.test(rawDesc);

    var timeStr = '';
    if (isTimeUnknown) {
      timeStr = 'Uhrzeit noch offen';
    } else if (event.start.dateTime) {
      var startTime = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      if (isOpenEnd) {
        timeStr = 'ab ' + startTime + ' Uhr (Ende offen)';
      } else if (event.end && event.end.dateTime) {
        var endTime = new Date(event.end.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        timeStr = startTime + '–' + endTime + ' Uhr';
      } else {
        timeStr = startTime + ' Uhr';
      }
    }

    var bandMatch = rawDesc.match(/band:\s*(.+?)(?:\n|$)/i);
    var band      = bandMatch ? escapeHtml(bandMatch[1].trim()) : '';
    var cleanDesc = rawDesc
      .replace(/band:\s*.+?(?:\n|$)/gi, '')
      .replace(/open\s*end|ende\s*offen|end\s*offen|offen|tbd/gi, '')
      .replace(/zeit\s*offen|uhrzeit\s*offen|zeit\s*unbekannt|uhrzeit\s*unbekannt/gi, '')
      .trim();
    var description = cleanDesc ? escapeHtml(cleanDesc) : '';

    return {
      dateISO:       dateISO,
      dateFormatted: dateFormatted,
      title:         escapeHtml(event.summary || 'Auftritt'),
      band:          band,
      location:      event.location ? escapeHtml(event.location) : '',
      timeStr:       timeStr,
      description:   description
    };
  }

  var INITIAL_SHOW = 5;
  var LOAD_MORE    = 5;

  function createEventItem(event) {
    var d = parseEventData(event);

    var article = document.createElement('article');
    article.className = 'show-item';
    article.setAttribute('role', 'listitem');
    article.innerHTML =
      '<time class="show-date" datetime="' + d.dateISO + '">' + d.dateFormatted + '</time>' +
      '<span class="show-venue">' + d.title + '</span>' +
      (d.band        ? '<p class="show-band">♪ ' + d.band + '</p>' : '') +
      (d.location    ? '<p class="show-location">' + d.location + '</p>' : '') +
      (d.timeStr     ? '<p class="show-detail">' + d.timeStr + '</p>' : '') +
      (d.description ? '<p class="show-desc">' + d.description + '</p>' : '');
    return article;
  }

  function loadCalendarEvents() {
    var grid = document.getElementById('shows-grid');
    if (!grid) return;

    var now = new Date().toISOString();
    var url = 'https://www.googleapis.com/calendar/v3/calendars/'
      + encodeURIComponent(CALENDAR_ID)
      + '/events?key=' + API_KEY
      + '&timeMin=' + encodeURIComponent(now)
      + '&singleEvents=true&orderBy=startTime&maxResults=50';

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error.message);
        grid.innerHTML = '';
        if (!data.items || data.items.length === 0) {
          grid.innerHTML = '<p class="shows-empty">Aktuell sind keine bevorstehenden Auftritte eingetragen. Schauen Sie bald wieder vorbei!</p>';
          return;
        }

        var items   = data.items;
        var visible = INITIAL_SHOW;

        var list = document.createElement('div');
        list.className = 'show-list';
        list.setAttribute('role', 'list');

        var btnMore = document.createElement('button');
        btnMore.className = 'btn btn-secondary shows-more-btn';
        btnMore.hidden = true;

        var btnLess = document.createElement('button');
        btnLess.className = 'btn btn-secondary shows-more-btn';
        btnLess.textContent = 'Weniger anzeigen';
        btnLess.hidden = true;

        function render() {
          list.innerHTML = '';
          items.slice(0, visible).forEach(function (event) {
            list.appendChild(createEventItem(event));
          });
          var remaining = items.length - visible;
          var next = Math.min(remaining, LOAD_MORE);
          if (next > 0) {
            btnMore.textContent = next === 1 ? 'Weiteren 1 Termin anzeigen' : 'Weitere ' + next + ' Termine anzeigen';
            btnMore.hidden = false;
          } else {
            btnMore.hidden = true;
          }
          btnLess.hidden = visible <= INITIAL_SHOW;
        }

        btnMore.addEventListener('click', function () {
          visible += LOAD_MORE;
          render();
        });

        btnLess.addEventListener('click', function () {
          visible = INITIAL_SHOW;
          render();
        });

        grid.appendChild(list);
        grid.appendChild(btnMore);
        grid.appendChild(btnLess);
        render();
      })
      .catch(function () {
        grid.innerHTML = '<p class="shows-empty">Auftritte konnten nicht geladen werden. Bitte direkt Kontakt aufnehmen.</p>';
      });
  }

  loadCalendarEvents();

  // ----- Foto-Slideshow (Über mich) -----
  var slideshowFotos = [
    'Bilder/FB_IMG_1724266123457.jpg',
    'Bilder/IMG_1885.jpg',
    'Bilder/IMG_1901.jpg',
    'Bilder/IMG_1908.jpg',
    'Bilder/IMG_1918.jpg',
    'Bilder/IMG_1945.jpg',
    'Bilder/IMG_1981.jpg',
    'Bilder/IMG_1998.jpg',
    'Bilder/IMG_2021.jpg',
    'Bilder/IMG_2053.jpg',
    'Bilder/IMG_2058.jpg',
    'Bilder/IMG_2090.jpg',
    'Bilder/IMG_2142.jpg',
    'Bilder/IMG_2142-2.jpg',
    'Bilder/IMG_2145-2.jpg',
    'Bilder/IMG_5569[300].jpg',
    'Bilder/IMG_5579[298].jpg'
  ];

  var slideshowImg  = document.getElementById('slideshow-img');
  var slideshowPrev = document.querySelector('.slideshow-prev');
  var slideshowNext = document.querySelector('.slideshow-next');

  if (slideshowImg && slideshowPrev && slideshowNext) {
    var slideshowIdx = 0;

    function showSlide(index) {
      slideshowIdx = (index + slideshowFotos.length) % slideshowFotos.length;
      slideshowImg.src = slideshowFotos[slideshowIdx];
    }

    slideshowPrev.addEventListener('click', function () { showSlide(slideshowIdx - 1); });
    slideshowNext.addEventListener('click', function () { showSlide(slideshowIdx + 1); });
  }

  // ----- Lightbox (Band-Galerien) -----
  var activeNav = null;

  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lightbox-img');
  var lbLinks  = Array.from(document.querySelectorAll('.galerie-link'));

  if (lightbox && lbImg && lbLinks.length) {
    var lbCurrent = 0;

    function lbOpen(index) {
      lbCurrent = index;
      lbImg.src = lbLinks[lbCurrent].href;
      lbImg.alt = lbLinks[lbCurrent].querySelector('img').alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      activeNav = {
        prev:  function () { lbOpen((lbCurrent - 1 + lbLinks.length) % lbLinks.length); },
        next:  function () { lbOpen((lbCurrent + 1) % lbLinks.length); },
        close: lbClose
      };
    }

    function lbClose() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      activeNav = null;
    }

    lbLinks.forEach(function (link, i) {
      link.addEventListener('click', function (e) { e.preventDefault(); lbOpen(i); });
    });

    document.getElementById('lightbox-close').addEventListener('click', lbClose);
    document.getElementById('lightbox-prev').addEventListener('click', function () { if (activeNav) activeNav.prev(); });
    document.getElementById('lightbox-next').addEventListener('click', function () { if (activeNav) activeNav.next(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lbClose(); });
  }

  document.addEventListener('keydown', function (e) {
    if (!activeNav) return;
    if (e.key === 'Escape')     activeNav.close();
    if (e.key === 'ArrowLeft')  activeNav.prev();
    if (e.key === 'ArrowRight') activeNav.next();
  });

}());
