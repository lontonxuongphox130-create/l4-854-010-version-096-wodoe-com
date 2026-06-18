(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var shell = document.querySelector("[data-player]");
    if (!shell) {
      return;
    }

    var video = shell.querySelector("video");
    var button = shell.querySelector("[data-play]");
    var message = shell.querySelector("[data-player-message]");
    var source = shell.getAttribute("data-source");
    var loaded = false;
    var hlsInstance = null;

    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }

    function loadSource() {
      if (!video || !source || loaded) {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage("视频加载失败，请稍后重试");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        setMessage("当前浏览器无法播放该视频");
      }

      loaded = true;
    }

    function playVideo() {
      loadSource();
      if (!video) {
        return;
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          setMessage("请再次点击播放");
        });
      }
      if (button) {
        button.hidden = true;
      }
    }

    if (button) {
      button.addEventListener("click", playVideo);
    }

    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () {
        if (button) {
          button.hidden = true;
        }
        setMessage("");
      });
      video.addEventListener("pause", function () {
        if (button && video.currentTime === 0) {
          button.hidden = false;
        }
      });
    }

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
