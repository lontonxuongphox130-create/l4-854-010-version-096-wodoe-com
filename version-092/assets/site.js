(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) return;
    button.addEventListener('click', function () {
      var opened = panel.hasAttribute('hidden');
      if (opened) {
        panel.removeAttribute('hidden');
        button.setAttribute('aria-expanded', 'true');
        button.textContent = '×';
      } else {
        panel.setAttribute('hidden', '');
        button.setAttribute('aria-expanded', 'false');
        button.textContent = '☰';
      }
    });
  }

  function setupHero() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) return;
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) return;
    var current = 0;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('hero-slide-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
      });
    });
    window.setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var list = document.querySelector('[data-card-list]');
      if (!list) return;
      var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
      var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-type]'));
      var search = panel.querySelector('[data-card-search]');
      var activeType = 'all';
      var activeValue = 'all';
      function apply() {
        var keyword = search ? search.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = (card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.year + ' ' + card.dataset.genre).toLowerCase();
          var matchedText = !keyword || text.indexOf(keyword) !== -1;
          var matchedFilter = true;
          if (activeType === 'region') matchedFilter = card.dataset.region === activeValue;
          if (activeType === 'year') matchedFilter = card.dataset.year === activeValue;
          card.classList.toggle('card-hidden', !(matchedText && matchedFilter));
        });
      }
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); });
          button.classList.add('active');
          activeType = button.dataset.filterType;
          activeValue = button.dataset.filterValue;
          apply();
        });
      });
      if (search) search.addEventListener('input', apply);
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (wrap) {
      var video = wrap.querySelector('video');
      var button = wrap.querySelector('.player-overlay');
      if (!video || !button) return;
      var src = video.getAttribute('data-src');
      var loaded = false;
      function attach() {
        if (loaded) return;
        loaded = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.src = src;
        }
      }
      function play() {
        attach();
        wrap.classList.add('is-playing');
        video.setAttribute('controls', 'controls');
        var promise = video.play();
        if (promise && promise.catch) promise.catch(function () {});
      }
      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (!loaded || video.paused) play();
      });
    });
  }

  function cardTemplate(movie) {
    var tags = movie.tags.slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<article class="movie-card">' +
      '<a class="poster" href="./' + movie.file + '">' +
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="poster-gradient"></span>' +
      '</a>' +
      '<div class="movie-card-body">' +
      '<h2><a href="./' + movie.file + '">' + escapeHtml(movie.title) + '</a></h2>' +
      '<p>' + escapeHtml(movie.oneLine) + '</p>' +
      '<div class="meta-row"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.year) + '年</span></div>' +
      '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function setupSearch() {
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');
    if (!input || !results || !window.SEARCH_MOVIES) return;
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;
    function render() {
      var q = input.value.trim().toLowerCase();
      var source = window.SEARCH_MOVIES;
      var list = q ? source.filter(function (movie) {
        return movie.searchText.indexOf(q) !== -1;
      }) : source.slice(0, 48);
      results.innerHTML = list.slice(0, 96).map(cardTemplate).join('') || '<div class="story-card"><h2>没有找到匹配影片</h2><p>可以尝试更换片名、地区、年份或类型关键词。</p></div>';
    }
    input.addEventListener('input', render);
    render();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
    setupSearch();
  });
})();
