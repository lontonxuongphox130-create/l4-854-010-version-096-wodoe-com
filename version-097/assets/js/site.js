(function () {
    function selectAll(selector, parent) {
        return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
    }

    function initializeMenu() {
        var button = document.querySelector('.menu-toggle');
        var nav = document.querySelector('.mobile-nav');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initializeHero() {
        var hero = document.querySelector('.hero');
        if (!hero) {
            return;
        }
        var slides = selectAll('.hero-slide', hero);
        var dots = selectAll('.hero-dots button', hero);
        var prev = hero.querySelector('.hero-control.prev');
        var next = hero.querySelector('.hero-control.next');
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
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
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function matchesCard(card, query, region, year) {
        var title = (card.getAttribute('data-title') || '').toLowerCase();
        var genre = (card.getAttribute('data-genre') || '').toLowerCase();
        var cardRegion = card.getAttribute('data-region') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var haystack = title + ' ' + genre + ' ' + cardRegion.toLowerCase() + ' ' + cardYear;
        var queryOk = !query || haystack.indexOf(query) !== -1;
        var regionOk = !region || cardRegion.indexOf(region) !== -1;
        var yearOk = !year || cardYear.indexOf(year) !== -1;
        return queryOk && regionOk && yearOk;
    }

    function initializeFilters() {
        selectAll('[data-filter-scope]').forEach(function (scope) {
            var queryInput = scope.querySelector('[data-filter-query]');
            var regionSelect = scope.querySelector('[data-filter-region]');
            var yearSelect = scope.querySelector('[data-filter-year]');
            var cards = selectAll('.movie-card', scope);
            var empty = scope.querySelector('.no-results');

            function applyFilter() {
                var query = queryInput ? queryInput.value.trim().toLowerCase() : '';
                var region = regionSelect ? regionSelect.value : '';
                var year = yearSelect ? yearSelect.value : '';
                var visible = 0;
                cards.forEach(function (card) {
                    var isVisible = matchesCard(card, query, region, year);
                    card.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }

            [queryInput, regionSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', applyFilter);
                    control.addEventListener('change', applyFilter);
                }
            });
        });
    }

    window.initMoviePlayer = function (videoId, source, overlayId) {
        var video = document.getElementById(videoId);
        var overlay = document.getElementById(overlayId);
        if (!video || !source) {
            return;
        }
        var loaded = false;
        var hlsInstance = null;

        function load() {
            if (loaded) {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    maxBufferLength: 30,
                    enableWorker: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
            } else {
                video.src = source;
            }
            loaded = true;
        }

        function play() {
            load();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener('click', play);
        }
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
        video.addEventListener('emptied', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
            loaded = false;
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initializeMenu();
        initializeHero();
        initializeFilters();
    });
}());
