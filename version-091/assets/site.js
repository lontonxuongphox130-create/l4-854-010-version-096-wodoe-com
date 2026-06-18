(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
        }
        show(i);
        start();
      });
    });

    start();
  }

  function fillTypeOptions() {
    var select = document.querySelector("[data-type-filter]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    if (!select || select.children.length > 1 || cards.length === 0) {
      return;
    }
    var map = {};
    cards.forEach(function (card) {
      var value = card.getAttribute("data-type");
      if (value) {
        map[value] = true;
      }
    });
    Object.keys(map).sort().forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function initFiltering() {
    var input = document.querySelector("[data-filter-input]");
    var typeFilter = document.querySelector("[data-type-filter]");
    var regionFilter = document.querySelector("[data-region-filter]");
    var list = document.querySelector("[data-card-list]");
    var emptyState = document.querySelector("[data-empty-state]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    if (!list || cards.length === 0) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (query && input) {
      input.value = query;
    }

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var typeValue = normalize(typeFilter ? typeFilter.value : "");
      var regionValue = normalize(regionFilter ? regionFilter.value : "");
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-type"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre")
        ].join(" "));
        var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var okType = !typeValue || normalize(card.getAttribute("data-type")) === typeValue;
        var okRegion = !regionValue || normalize(card.getAttribute("data-region")) === regionValue;
        var ok = okKeyword && okType && okRegion;
        card.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle("is-visible", visible === 0);
      }
    }

    [input, typeFilter, regionFilter].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  }

  function initSorting() {
    var select = document.querySelector("[data-sort-control]");
    var list = document.querySelector("[data-card-list]");
    if (!select || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll("[data-movie-card]"));
    select.addEventListener("change", function () {
      var mode = select.value;
      var sorted = cards.slice();
      if (mode === "year-desc") {
        sorted.sort(function (a, b) {
          return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
        });
      }
      if (mode === "title-asc") {
        sorted.sort(function (a, b) {
          return String(a.getAttribute("data-title")).localeCompare(String(b.getAttribute("data-title")), "zh-CN");
        });
      }
      sorted.forEach(function (card) {
        list.appendChild(card);
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    fillTypeOptions();
    initFiltering();
    initSorting();
  });
})();

function setupPlayer(videoId, streamUrl) {
  function attach() {
    var video = document.getElementById(videoId);
    if (!video) {
      return;
    }
    var root = video.closest("[data-player-root]") || video.parentElement;
    var overlay = root ? root.querySelector(".player-overlay") : null;
    var button = root ? root.querySelector(".player-button") : null;
    var started = false;

    function load() {
      if (started) {
        return;
      }
      started = true;
      if (overlay) {
        overlay.classList.add("hidden");
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        video.hlsInstance = hls;
      } else {
        video.src = streamUrl;
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener("click", load);
    }
    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        load();
      });
    }
    video.addEventListener("click", function () {
      if (!started) {
        load();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
}
