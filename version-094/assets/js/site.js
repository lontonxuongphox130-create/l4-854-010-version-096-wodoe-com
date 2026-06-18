(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var toggle = document.querySelector("[data-mobile-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open");
    });
  }

  function initHeroCarousel() {
    document.querySelectorAll("[data-hero]").forEach(function (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var index = 0;
      var timer = null;

      if (slides.length <= 1) {
        return;
      }

      function show(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          start();
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
          start();
        });
      });

      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      start();
    });
  }

  function normalized(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMovieFilters() {
    document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
      var searchInput = scope.querySelector("[data-movie-search]");
      var regionSelect = scope.querySelector("[data-filter-region]");
      var typeSelect = scope.querySelector("[data-filter-type]");
      var yearSelect = scope.querySelector("[data-filter-year]");
      var resetButton = scope.querySelector("[data-filter-reset]");
      var empty = scope.querySelector("[data-filter-empty]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));

      if (!cards.length) {
        return;
      }

      function apply() {
        var keyword = normalized(searchInput && searchInput.value);
        var region = regionSelect ? regionSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var year = yearSelect ? yearSelect.value : "";
        var shown = 0;

        cards.forEach(function (card) {
          var haystack = normalized([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.tags
          ].join(" "));
          var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchRegion = !region || card.dataset.region === region;
          var matchType = !type || card.dataset.type === type;
          var matchYear = !year || card.dataset.year === year;
          var visible = matchKeyword && matchRegion && matchType && matchYear;

          card.hidden = !visible;
          if (visible) {
            shown += 1;
          }
        });

        if (empty) {
          empty.hidden = shown !== 0;
        }
      }

      [searchInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      });

      if (resetButton) {
        resetButton.addEventListener("click", function () {
          if (searchInput) {
            searchInput.value = "";
          }
          if (regionSelect) {
            regionSelect.value = "";
          }
          if (typeSelect) {
            typeSelect.value = "";
          }
          if (yearSelect) {
            yearSelect.value = "";
          }
          apply();
        });
      }
    });
  }

  ready(function () {
    initMobileMenu();
    initHeroCarousel();
    initMovieFilters();
  });
})();
