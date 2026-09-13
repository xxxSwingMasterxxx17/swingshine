(function () {
  'use strict';
  var banner = document.querySelector('.school-banner');
  if (!banner) return;
  var video = banner.querySelector('video');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobilePortrait = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
  var connection = navigator.connection;
  var requested = false;
  var inView = true;
  var failed = false;

  function preferStill() {
    return motion.matches || (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)));
  }

  function play() {
    if (failed || !requested || document.hidden || !inView) return;
    if (!video.getAttribute('src')) {
      video.src = mobilePortrait.matches
        ? 'videos/school-banner-mobile.mp4?v=20260913-4' : 'videos/school-banner.mp4?v=20260913-3';
    }
    video.muted = true;
    var result = video.play();
    if (result) result.catch(function (error) {
      if (error.name === 'AbortError') return;
      requested = false;
    });
  }

  video.addEventListener('playing', function () {
    banner.classList.add('is-playing');
  });
  video.addEventListener('error', function () {
    failed = true;
    requested = false;
    banner.classList.remove('is-playing');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause();
    else play();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) play();
      else video.pause();
    }).observe(banner);
  }
  function respectPreferences() {
    requested = !preferStill();
    if (requested) play();
    else {
      video.pause();
    }
  }
  motion.addEventListener('change', respectPreferences);
  if (connection) connection.addEventListener('change', respectPreferences);
  mobilePortrait.addEventListener('change', function () {
    video.pause();
    video.removeAttribute('src');
    video.load();
    banner.classList.remove('is-playing');
    failed = false;
    play();
  });

  // Let the critical page assets load first. With JS disabled, the image stands alone.
  function start() {
    requested = !preferStill();
    play();
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}());
