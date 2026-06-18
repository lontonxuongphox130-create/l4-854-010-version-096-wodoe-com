(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      var opened = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function setupHeroCarousel() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function activate(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (slides.length <= 1) {
      return;
    }

    if (prev) {
      prev.addEventListener("click", function () {
        activate(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        activate(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        activate(index);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    activate(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var scope = panel.closest("section") || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
      var emptyState = scope.querySelector("[data-empty-state]");
      var searchInput = panel.querySelector("[data-search-input]");
      var regionFilter = panel.querySelector("[data-region-filter]");
      var typeFilter = panel.querySelector("[data-type-filter]");
      var yearFilter = panel.querySelector("[data-year-filter]");
      var clearButton = panel.querySelector("[data-clear-filter]");

      function applyFilters() {
        var query = normalize(searchInput && searchInput.value);
        var region = normalize(regionFilter && regionFilter.value);
        var type = normalize(typeFilter && typeFilter.value);
        var year = normalize(yearFilter && yearFilter.value);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var text = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(" "));
          var matchQuery = !query || text.indexOf(query) !== -1;
          var matchRegion = !region || normalize(card.dataset.region) === region;
          var matchType = !type || normalize(card.dataset.type) === type;
          var matchYear = !year || normalize(card.dataset.year) === year;
          var visible = matchQuery && matchRegion && matchType && matchYear;
          card.hidden = !visible;
          if (visible) {
            visibleCount += 1;
          }
        });

        if (emptyState) {
          emptyState.hidden = visibleCount !== 0;
        }
      }

      [searchInput, regionFilter, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilters);
          control.addEventListener("change", applyFilters);
        }
      });

      if (clearButton) {
        clearButton.addEventListener("click", function () {
          if (searchInput) {
            searchInput.value = "";
          }
          if (regionFilter) {
            regionFilter.value = "";
          }
          if (typeFilter) {
            typeFilter.value = "";
          }
          if (yearFilter) {
            yearFilter.value = "";
          }
          applyFilters();
        });
      }

      var params = new URLSearchParams(window.location.search);
      var queryParam = params.get("q");
      if (queryParam && searchInput) {
        searchInput.value = queryParam;
      }
      applyFilters();
    });
  }

  function setupPlayer() {
    var playerCard = document.querySelector("[data-video-player]");
    if (!playerCard) {
      return;
    }

    var video = playerCard.querySelector("video");
    var button = playerCard.querySelector("[data-play-button]");
    var status = playerCard.querySelector("[data-player-status]");
    var source = playerCard.dataset.src;
    var hlsInstance = null;

    function setStatus(message, isError) {
      if (status) {
        status.textContent = message;
      }
      playerCard.classList.toggle("is-error", Boolean(isError));
      playerCard.classList.toggle("is-ready", !isError && message === "ready");
    }

    function bindSource() {
      if (!video || !source) {
        setStatus("视频地址不可用", true);
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus("ready", false);
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
          if (data && data.fatal) {
            setStatus("视频加载失败，请稍后重试", true);
          }
        });
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.addEventListener("loadedmetadata", function () {
          setStatus("ready", false);
        });
        video.addEventListener("error", function () {
          setStatus("视频加载失败，请稍后重试", true);
        });
        return;
      }

      setStatus("当前浏览器不支持 HLS 播放", true);
    }

    function playVideo() {
      if (!video) {
        return;
      }
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          setStatus("点击播放器后可继续播放", false);
        });
      }
    }

    if (button) {
      button.addEventListener("click", playVideo);
    }

    if (video) {
      video.addEventListener("play", function () {
        playerCard.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        playerCard.classList.remove("is-playing");
      });
    }

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });

    bindSource();
  }

  ready(function () {
    setupMenu();
    setupHeroCarousel();
    setupFilters();
    setupPlayer();
  });
})();
