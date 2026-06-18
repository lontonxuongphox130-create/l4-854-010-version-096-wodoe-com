(function () {
  window.setupPlayer = function (id, url) {
    var root = document.getElementById(id);

    if (!root) {
      return;
    }

    var video = root.querySelector('video');
    var cover = root.querySelector('[data-play]');
    var hls = null;
    var ready = false;

    function load() {
      if (ready || !video) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }

      ready = true;
    }

    function start() {
      load();

      if (cover) {
        cover.classList.add('is-hidden');
      }

      var promise = video.play();

      if (promise && promise.catch) {
        promise.catch(function () {
          if (cover) {
            cover.classList.remove('is-hidden');
          }
        });
      }
    }

    if (cover) {
      cover.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', function () {
      if (cover) {
        cover.classList.add('is-hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (cover && video.currentTime === 0) {
        cover.classList.remove('is-hidden');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();
