(function () {
  var mobileButton = document.querySelector('[data-mobile-menu]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      var url = './search.html';

      if (value) {
        url += '?q=' + encodeURIComponent(value);
      }

      window.location.href = url;
    });
  });

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function setSlide(index) {
      current = index;
      slides.forEach(function (slide, position) {
        slide.classList.toggle('is-active', position === current);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        setSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        setSlide((current + 1) % slides.length);
      }, 5600);
    }
  }

  function applyFilter(scope, query, year) {
    var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
    var empty = scope.querySelector('[data-empty-state]');
    var normalized = (query || '').trim().toLowerCase();
    var count = 0;

    cards.forEach(function (card) {
      var text = (card.getAttribute('data-search') || '').toLowerCase();
      var cardYear = card.getAttribute('data-year') || '';
      var visible = (!normalized || text.indexOf(normalized) !== -1) && (!year || cardYear.indexOf(year) !== -1);
      card.style.display = visible ? '' : 'none';

      if (visible) {
        count += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('is-visible', count === 0);
    }
  }

  document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
    var input = scope.querySelector('[data-filter-input]');
    var select = scope.querySelector('[data-year-filter]');
    var form = document.querySelector('[data-inline-search-form]');
    var params = new URLSearchParams(window.location.search);
    var firstQuery = params.get('q') || '';

    if (input && firstQuery && !input.value) {
      input.value = firstQuery;
    }

    function update() {
      applyFilter(scope, input ? input.value : '', select ? select.value : '');
    }

    if (input) {
      input.addEventListener('input', update);
    }

    if (select) {
      select.addEventListener('change', update);
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        update();
      });
    }

    update();
  });
})();
