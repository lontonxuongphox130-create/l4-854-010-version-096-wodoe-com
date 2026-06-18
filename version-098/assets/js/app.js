(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var toggle = qs('[data-menu-toggle]');
  var mobileNav = qs('[data-mobile-nav]');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  qsa('[data-hero-slider]').forEach(function (slider) {
    var slides = qsa('.hero-slide', slider);
    var prev = qs('[data-hero-prev]', slider);
    var next = qs('[data-hero-next]', slider);
    var dotsWrap = qs('[data-hero-dots]', slider);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      qsa('button', dotsWrap).forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', '切换影片');
        dot.addEventListener('click', function () {
          show(i);
          restart();
        });
        dotsWrap.appendChild(dot);
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  });

  qsa('[data-filter-panel]').forEach(function (panel) {
    var input = qs('[data-filter-input]', panel);
    var category = qs('[data-filter-category]', panel);
    var year = qs('[data-filter-year]', panel);
    var scope = panel.parentElement || document;
    var cards = qsa('.filter-card', scope);
    var empty = qs('[data-empty-state]', scope);

    function yearMatch(cardYear, value) {
      var numericYear = parseInt(cardYear || '0', 10);
      if (!value) {
        return true;
      }
      if (value === '2020') {
        return numericYear >= 2020;
      }
      if (value === '2010') {
        return numericYear >= 2010 && numericYear <= 2019;
      }
      if (value === '2000') {
        return numericYear >= 2000 && numericYear <= 2009;
      }
      if (value === '1990') {
        return numericYear < 2000;
      }
      return true;
    }

    function apply() {
      var keyword = (input && input.value ? input.value : '').trim().toLowerCase();
      var selectedCategory = category && category.value ? category.value : '';
      var selectedYear = year && year.value ? year.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = (card.getAttribute('data-title') || '').toLowerCase();
        var cardCategory = card.getAttribute('data-category') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var pass = true;
        if (keyword && text.indexOf(keyword) === -1) {
          pass = false;
        }
        if (selectedCategory && cardCategory !== selectedCategory) {
          pass = false;
        }
        if (!yearMatch(cardYear, selectedYear)) {
          pass = false;
        }
        card.classList.toggle('is-hidden', !pass);
        if (pass) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, category, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && input) {
      input.value = q;
    }
    apply();
  });
})();

function initMoviePlayer(source) {
  var shell = document.querySelector('[data-player-shell]');
  var video = document.querySelector('[data-movie-video]');
  var overlay = document.querySelector('[data-player-overlay]');
  var toggle = document.querySelector('[data-player-toggle]');
  var mute = document.querySelector('[data-player-mute]');
  var fullscreen = document.querySelector('[data-player-fullscreen]');
  var message = document.querySelector('[data-player-message]');
  var attached = false;
  var hls = null;

  if (!shell || !video || !source) {
    return;
  }

  function showMessage(text) {
    if (message) {
      message.textContent = text;
      message.classList.add('is-visible');
    }
  }

  function attach() {
    if (attached) {
      return;
    }
    attached = true;
    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (data && data.fatal) {
          showMessage('视频暂时无法播放，请稍后再试');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else {
      showMessage('视频暂时无法播放，请稍后再试');
    }
  }

  function start() {
    attach();
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    shell.classList.add('is-playing');
    video.controls = true;
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        showMessage('点击播放器继续观看');
      });
    }
  }

  function togglePlay() {
    if (video.paused) {
      start();
    } else {
      video.pause();
      shell.classList.remove('is-playing');
    }
  }

  if (overlay) {
    overlay.addEventListener('click', start);
  }

  video.addEventListener('click', togglePlay);

  if (toggle) {
    toggle.addEventListener('click', togglePlay);
  }

  if (mute) {
    mute.addEventListener('click', function () {
      video.muted = !video.muted;
      mute.textContent = video.muted ? '取消静音' : '静音';
    });
  }

  if (fullscreen) {
    fullscreen.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (shell.requestFullscreen) {
        shell.requestFullscreen();
      }
    });
  }

  video.addEventListener('play', function () {
    shell.classList.add('is-playing');
    if (toggle) {
      toggle.textContent = '暂停';
    }
  });

  video.addEventListener('pause', function () {
    shell.classList.remove('is-playing');
    if (toggle) {
      toggle.textContent = '播放';
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
