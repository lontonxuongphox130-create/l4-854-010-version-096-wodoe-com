(function () {
  var HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
  var hlsLoaderPromise = null;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function loadHlsLibrary() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsLoaderPromise) {
      return hlsLoaderPromise;
    }

    hlsLoaderPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = HLS_CDN;
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error("HLS 播放库加载失败"));
      };
      document.head.appendChild(script);
    });

    return hlsLoaderPromise;
  }

  function setMessage(root, message) {
    var messageNode = root.querySelector("[data-player-message]");
    if (messageNode) {
      messageNode.textContent = message || "";
    }
  }

  function safePlay(video) {
    var result = video.play();
    if (result && typeof result.catch === "function") {
      result.catch(function () {
        /* The browser may require another user click; controls remain visible. */
      });
    }
  }

  function startPlayer(root) {
    var video = root.querySelector("video[data-src]");
    var src = video ? video.dataset.src : "";

    if (!video || !src) {
      setMessage(root, "播放源缺失。");
      return;
    }

    root.classList.add("is-loading");
    setMessage(root, "正在加载播放源…");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      root.classList.add("is-playing");
      setMessage(root, "");
      safePlay(video);
      return;
    }

    loadHlsLibrary()
      .then(function (Hls) {
        if (!Hls || !Hls.isSupported()) {
          setMessage(root, "当前浏览器不支持 HLS 播放，请尝试使用支持 HLS 的浏览器。");
          return;
        }

        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          root.classList.add("is-playing");
          setMessage(root, "");
          safePlay(video);
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage(root, "播放源加载异常，请稍后重试或打开播放源。");
          }
        });
        video._hls = hls;
      })
      .catch(function () {
        setMessage(root, "HLS 播放库加载失败，请检查网络后重试。");
      });
  }

  ready(function () {
    document.querySelectorAll("[data-player-root]").forEach(function (root) {
      var button = root.querySelector("[data-play-button]");
      if (button) {
        button.addEventListener("click", function () {
          startPlayer(root);
        });
      }
    });
  });
})();
