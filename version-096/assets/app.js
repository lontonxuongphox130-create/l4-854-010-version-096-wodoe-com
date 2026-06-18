(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    document.querySelectorAll("[data-hero]").forEach(function (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var index = 0;
      var timer;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("active", slideIndex === index);
        });
        dots.forEach(function (dot) {
          dot.classList.toggle("active", Number(dot.getAttribute("data-hero-dot")) === index);
        });
      }

      function play() {
        clearInterval(timer);
        timer = setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(Number(dot.getAttribute("data-hero-dot")) || 0);
          play();
        });
      });

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          play();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          play();
        });
      }

      show(0);
      play();
    });

    document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector("[data-search-input]");
      var region = panel.querySelector("[data-region-filter]");
      var year = panel.querySelector("[data-year-filter]");
      var type = panel.querySelector("[data-type-filter]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));

      function matchYear(cardYear, value) {
        var yearNumber = Number(cardYear);
        if (value === "全部年代") {
          return true;
        }
        if (value === "2010-2019") {
          return yearNumber >= 2010 && yearNumber <= 2019;
        }
        if (value === "2000-2009") {
          return yearNumber >= 2000 && yearNumber <= 2009;
        }
        if (value === "1990以前") {
          return yearNumber > 0 && yearNumber < 1990;
        }
        return String(cardYear) === value;
      }

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var regionValue = region ? region.value : "全部地区";
        var yearValue = year ? year.value : "全部年代";
        var typeValue = type ? type.value : "全部类型";

        cards.forEach(function (card) {
          var text = (card.getAttribute("data-title") || "").toLowerCase();
          var cardRegion = card.getAttribute("data-region") || "";
          var cardType = card.getAttribute("data-type") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var visible = true;

          if (keyword && text.indexOf(keyword) === -1) {
            visible = false;
          }
          if (regionValue !== "全部地区" && cardRegion.indexOf(regionValue) === -1) {
            visible = false;
          }
          if (typeValue !== "全部类型" && cardType !== typeValue) {
            visible = false;
          }
          if (!matchYear(cardYear, yearValue)) {
            visible = false;
          }

          card.classList.toggle("is-hidden", !visible);
        });
      }

      [input, region, year, type].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      });
    });
  });
})();
