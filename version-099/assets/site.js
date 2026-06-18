(function () {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const next = hero.querySelector('[data-hero-next]');
    const prev = hero.querySelector('[data-hero-prev]');
    let current = 0;
    let timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
    const searchInput = scope.querySelector('[data-card-search]');
    const cards = Array.from(scope.querySelectorAll('.movie-card'));
    let activeRegion = 'all';
    let activeYear = 'all';

    function yearBucket(year) {
      const numericYear = parseInt(year, 10);

      if (numericYear >= 2020) {
        return '2020+';
      }

      if (numericYear >= 2010) {
        return '2010-2019';
      }

      if (numericYear >= 2000) {
        return '2000-2009';
      }

      return '经典年代';
    }

    function applyFilters() {
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title || '',
          card.dataset.region || '',
          card.dataset.year || '',
          card.dataset.genre || ''
        ].join(' ').toLowerCase();
        const regionMatch = activeRegion === 'all' || card.dataset.region === activeRegion;
        const yearMatch = activeYear === 'all' || yearBucket(card.dataset.year) === activeYear;
        const keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
        card.classList.toggle('is-filter-hidden', !(regionMatch && yearMatch && keywordMatch));
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    scope.querySelectorAll('[data-filter-region]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeRegion = button.dataset.filterRegion;
        scope.querySelectorAll('[data-filter-region]').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilters();
      });
    });

    scope.querySelectorAll('[data-filter-year]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeYear = button.dataset.filterYear;
        scope.querySelectorAll('[data-filter-year]').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilters();
      });
    });
  });

  const searchForm = document.querySelector('[data-site-search]');
  const results = document.querySelector('[data-search-results]');

  if (searchForm && results && window.SEARCH_MOVIES) {
    const input = searchForm.querySelector('input[name="q"]');
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';

    if (input) {
      input.value = initial;
    }

    function render(items) {
      if (!items.length) {
        results.innerHTML = '<div class="search-empty">未找到匹配影片</div>';
        return;
      }

      results.innerHTML = items.slice(0, 120).map(function (movie) {
        return '<article class="movie-card">' +
          '<a class="poster-wrap" href="' + movie.url + '">' +
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
          '<span class="poster-shade"></span>' +
          '<span class="corner-pill">' + escapeHtml(movie.region) + '</span>' +
          '</a>' +
          '<div class="card-body">' +
          '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="meta-line"><span>' + escapeHtml(movie.genre) + '</span><span>' + movie.year + '</span></div>' +
          '<div class="card-tags"><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.category) + '</span></div>' +
          '</div>' +
          '</article>';
      }).join('');
    }

    function runSearch() {
      const keyword = input ? input.value.trim().toLowerCase() : '';
      const items = window.SEARCH_MOVIES.filter(function (movie) {
        const haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.category].join(' ').toLowerCase();
        return !keyword || haystack.indexOf(keyword) !== -1;
      });
      render(items);
    }

    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      runSearch();
    });

    if (input) {
      input.addEventListener('input', runSearch);
    }

    runSearch();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();

function initMoviePlayer(videoId, overlayId, buttonId, sourceUrl) {
  const video = document.getElementById(videoId);
  const overlay = document.getElementById(overlayId);
  const button = document.getElementById(buttonId);
  let hls = null;
  let loaded = false;
  let ready = false;
  let pendingPlay = false;

  if (!video || !sourceUrl) {
    return;
  }

  function showOverlay() {
    if (button) {
      button.textContent = '▶';
    }

    if (overlay) {
      overlay.classList.remove('is-hidden');
    }
  }

  function beginPlayback() {
    if (!ready && window.Hls && hls) {
      return;
    }

    if (overlay) {
      overlay.classList.add('is-hidden');
    }

    const promise = video.play();

    if (promise && typeof promise.catch === 'function') {
      promise.catch(showOverlay);
    }
  }

  function load() {
    if (loaded) {
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      ready = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        ready = true;

        if (pendingPlay) {
          beginPlayback();
        }
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          ready = true;
          video.src = sourceUrl;

          if (pendingPlay) {
            beginPlayback();
          }
        }
      });
      return;
    }

    video.src = sourceUrl;
    ready = true;
  }

  function play() {
    pendingPlay = true;
    load();
    beginPlayback();
  }

  if (overlay) {
    overlay.addEventListener('click', play);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    }
  });

  video.addEventListener('play', function () {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  });

  video.addEventListener('pause', function () {
    if (button) {
      button.textContent = '▶';
    }
  });

  video.addEventListener('ended', function () {
    pendingPlay = false;
    showOverlay();
  });

  window.addEventListener('pagehide', function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
}
