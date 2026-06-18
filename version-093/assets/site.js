(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-site-search]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            var input = form.querySelector('input[name="q"]');
            var value = input ? input.value.trim() : '';
            if (!value) {
                return;
            }
            event.preventDefault();
            window.location.href = 'search.html?q=' + encodeURIComponent(value);
        });
    });

    document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var tabs = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-tab]'));
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            tabs.forEach(function (tab, tabIndex) {
                tab.classList.toggle('is-active', tabIndex === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var nextIndex = parseInt(tab.getAttribute('data-hero-tab') || '0', 10);
                show(nextIndex);
                restart();
            });
        });

        show(0);
        restart();
    });

    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
        var input = panel.querySelector('[data-filter-input]');
        var regionSelect = panel.querySelector('[data-filter-region]');
        var typeSelect = panel.querySelector('[data-filter-type]');
        var yearSelect = panel.querySelector('[data-filter-year]');
        var grid = panel.parentElement ? panel.parentElement.querySelector('[data-card-grid]') : null;
        var empty = panel.parentElement ? panel.parentElement.querySelector('[data-empty-state]') : null;
        var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('[data-card]')) : [];

        function uniqueValues(attribute) {
            var values = [];
            cards.forEach(function (card) {
                var value = (card.getAttribute(attribute) || '').trim();
                if (value && values.indexOf(value) === -1) {
                    values.push(value);
                }
            });
            return values.sort(function (a, b) {
                return b.localeCompare(a, 'zh-CN');
            });
        }

        function fillSelect(select, values) {
            if (!select) {
                return;
            }
            values.forEach(function (value) {
                var option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        }

        fillSelect(regionSelect, uniqueValues('data-region'));
        fillSelect(typeSelect, uniqueValues('data-type'));
        fillSelect(yearSelect, uniqueValues('data-year'));

        function applyFilters() {
            var query = input ? input.value.trim().toLowerCase() : '';
            var region = regionSelect ? regionSelect.value : '';
            var type = typeSelect ? typeSelect.value : '';
            var year = yearSelect ? yearSelect.value : '';
            var visible = 0;

            cards.forEach(function (card) {
                var search = (card.getAttribute('data-search') || '').toLowerCase();
                var ok = true;
                if (query && search.indexOf(query) === -1) {
                    ok = false;
                }
                if (region && card.getAttribute('data-region') !== region) {
                    ok = false;
                }
                if (type && card.getAttribute('data-type') !== type) {
                    ok = false;
                }
                if (year && card.getAttribute('data-year') !== year) {
                    ok = false;
                }
                card.hidden = !ok;
                if (ok) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        [input, regionSelect, typeSelect, yearSelect].forEach(function (element) {
            if (element) {
                element.addEventListener('input', applyFilters);
                element.addEventListener('change', applyFilters);
            }
        });

        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q && input) {
            input.value = q;
        }
        applyFilters();
    });

    document.querySelectorAll('[data-player]').forEach(function (player) {
        var video = player.querySelector('video');
        var cover = player.querySelector('[data-player-cover]');
        var started = false;
        var hlsInstance = null;

        function attachStream() {
            if (!video || started) {
                return;
            }
            var stream = video.getAttribute('data-stream');
            if (!stream) {
                return;
            }
            started = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }
            video.controls = true;
            if (cover) {
                cover.hidden = true;
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener('click', attachStream);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (!started) {
                    attachStream();
                    return;
                }
                if (video.paused) {
                    video.play();
                }
            });
            video.addEventListener('error', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        }
    });
})();
