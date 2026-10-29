(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Seeded so the sky looks the same on every visit.
  function createRandom(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fillStarfields() {
    var fields = document.querySelectorAll('[data-starfield]');
    Array.prototype.forEach.call(fields, function (field, fieldIndex) {
      var random = createRandom(1987 + fieldIndex * 31);
      var count = parseInt(field.getAttribute('data-star-count'), 10) || 90;
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('span');
        var size = 0.8 + Math.pow(random(), 2.4) * 2.4;
        dot.className = random() > 0.7 ? 'mb-dot mb-dot--pale' : 'mb-dot';
        dot.style.left = (random() * 100).toFixed(2) + '%';
        dot.style.top = (random() * 100).toFixed(2) + '%';
        dot.style.width = size.toFixed(2) + 'px';
        dot.style.height = size.toFixed(2) + 'px';
        dot.style.setProperty('--alpha', (0.35 + random() * 0.6).toFixed(2));
        dot.style.setProperty('--duration', (3 + random() * 6).toFixed(2) + 's');
        dot.style.setProperty('--delay', (-random() * 9).toFixed(2) + 's');
        dot.style.opacity = 'var(--alpha)';
        fragment.appendChild(dot);
      }
      field.appendChild(fragment);
    });
  }

  function setupReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-revealed');
      });
      return;
    }

    Array.prototype.forEach.call(items, function (item) {
      var siblings = Array.prototype.filter.call(item.parentNode.children, function (child) {
        return child.hasAttribute('data-reveal');
      });
      item.style.setProperty('--reveal-delay', (siblings.indexOf(item) * 0.12).toFixed(2) + 's');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(items, function (item) {
      observer.observe(item);
    });
  }

  function setupCountdown() {
    var countdown = document.querySelector('[data-countdown]');
    if (!countdown) return;

    var festivalStart = new Date(2027, 1, 27);
    var festivalEnd = new Date(2027, 2, 1);
    var now = new Date();

    if (now >= festivalEnd) return;

    if (now >= festivalStart) {
      countdown.textContent = "C'est ce week-end\u00a0: la lune est levée\u00a0!";
    } else {
      var nights = Math.ceil((festivalStart - now) / 86400000);
      if (nights <= 1) {
        countdown.textContent = "Plus qu'une nuit avant le lever de la lune\u00a0!";
      } else {
        countdown.querySelector('[data-countdown-value]').textContent = nights;
      }
    }
    countdown.hidden = false;
  }

  function setupScrollEffects() {
    var hero = document.querySelector('[data-hero]');
    var progressButton = document.querySelector('[data-moon-progress]');
    var progressShadow = document.querySelector('[data-moon-shadow]');
    var ticking = false;

    function update() {
      ticking = false;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var pageProgress = scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0;

      if (hero && !reducedMotion.matches) {
        var rise = Math.min(1, Math.max(0, scrollY / heroHeight));
        hero.style.setProperty('--rise', rise.toFixed(4));
      }

      if (progressButton && progressShadow) {
        // The shadow slides away to the left: the moon waxes as the page is read.
        progressShadow.setAttribute('cx', (20 - pageProgress * 30).toFixed(2));
        progressButton.classList.toggle('is-visible', scrollY > heroHeight * 0.6);
      }
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  function between(min, max) {
    return min + Math.random() * (max - min);
  }

  // Starts somewhere between minTop and maxTop (px from the top of the layer).
  function launchMeteor(layer, minTop, maxTop) {
    var width = layer.offsetWidth;
    var towardsLeft = Math.random() < 0.65;
    var angle = towardsLeft ? between(142, 162) : between(18, 38);
    var distance = Math.max(180, Math.min(460, width * between(0.2, 0.32)));
    var duration = between(950, 1450);

    var meteor = document.createElement('span');
    var tail = document.createElement('span');
    meteor.className = 'mb-meteor';
    tail.className = 'mb-meteor-tail';
    meteor.style.left = (towardsLeft ? between(0.4, 0.92) : between(0.06, 0.5)) * width + 'px';
    meteor.style.top = between(minTop, maxTop) + 'px';
    meteor.style.setProperty('--length', Math.round(distance * between(0.4, 0.55)) + 'px');
    meteor.appendChild(tail);
    layer.appendChild(meteor);

    var rotation = 'rotate(' + angle.toFixed(1) + 'deg)';
    var flight = meteor.animate([
      { transform: rotation + ' translateX(0)', opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.62 },
      { transform: rotation + ' translateX(' + Math.round(distance) + 'px)', opacity: 0 }
    ], { duration: duration, easing: 'cubic-bezier(0.4, 0, 0.7, 1)' });

    tail.animate([
      { transform: 'scaleX(0.05)' },
      { transform: 'scaleX(1)', offset: 0.5 },
      { transform: 'scaleX(0.35)' }
    ], { duration: duration, easing: 'ease-out' });

    flight.onfinish = function () {
      meteor.remove();
    };
  }

  function setupMeteors() {
    var hero = document.querySelector('[data-hero]');
    var layer = hero && hero.querySelector('.mb-hero-stars');
    if (!layer || !layer.animate || reducedMotion.matches) return;

    var heroVisible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(hero);
    }

    function schedule(delay) {
      window.setTimeout(function () {
        if (heroVisible && !document.hidden) {
          launchMeteor(layer, hero.offsetHeight * 0.04, hero.offsetHeight * 0.34);
        }
        schedule(between(4500, 10000));
      }, delay);
    }

    schedule(3200);
  }

  // Shooting stars over the rest of the page, in the visible band between the
  // bottom of the hero and the footer.
  function setupPageMeteors() {
    var layer = document.querySelector('[data-page-meteors]');
    var hero = document.querySelector('[data-hero]');
    if (!layer || !layer.animate || reducedMotion.matches) return;

    var page = layer.parentNode;

    function schedule(delay) {
      window.setTimeout(function () {
        var top = Math.max(0, hero ? hero.getBoundingClientRect().bottom : 0);
        var bottom = Math.min(layer.offsetHeight, page.getBoundingClientRect().bottom);
        if (!document.hidden && bottom - top > 240) {
          launchMeteor(layer, top + (bottom - top) * 0.05, top + (bottom - top) * 0.5);
        }
        schedule(between(6000, 13000));
      }, delay);
    }

    schedule(5000);
  }

  function setupProfToggles() {
    var toggles = document.querySelectorAll('.mb-prof-toggle');
    Array.prototype.forEach.call(toggles, function (toggle) {
      var more = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!more) return;

      function setOpen(open) {
        more.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Réduire' : 'Lire la suite';
      }

      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        setOpen(open);
        if (!open && toggle.getBoundingClientRect().top < 0) {
          toggle.scrollIntoView({ block: 'center' });
        }
      });

      setOpen(false);
      toggle.hidden = false;
    });
  }

  // Faint stars glide towards the centre of the screen, fading in and out.
  function setupStarDrift() {
    var canvas = document.querySelector('[data-star-drift]');
    var context = canvas && canvas.getContext && canvas.getContext('2d');
    if (!context) return;

    var page = canvas.parentNode;
    var hero = document.querySelector('[data-hero]');
    var rootStyles = window.getComputedStyle(document.documentElement);
    var tones = [
      rootStyles.getPropertyValue('--mb-star').trim(),
      rootStyles.getPropertyValue('--mb-white').trim()
    ];
    var stars = [];
    var width = 0;
    var height = 0;
    var lastDraw = 0;

    function smoothstep(min, max, value) {
      var t = Math.min(1, Math.max(0, (value - min) / (max - min)));
      return t * t * (3 - 2 * t);
    }

    function build() {
      var count = width < 620 ? 70 : 140;
      if (stars.length === count) return;
      var random = createRandom(4242);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: random(),
          y: random(),
          size: 0.47 + random() * 0.84,
          alpha: 0.14 + random() * 0.32,
          tone: random() > 0.75 ? 1 : 0,
          phase: random(),
          speed: 0.00001 + random() * 0.000012
        });
      }
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      build();
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      // The hero has its own sky; stars fade in below it and stop at the footer.
      var top = hero ? hero.getBoundingClientRect().bottom : 0;
      var bottom = Math.min(height, page.getBoundingClientRect().bottom);
      if (bottom <= Math.max(0, top)) return;

      context.save();
      context.beginPath();
      context.rect(0, 0, width, bottom);
      context.clip();
      for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        var travel = (star.phase + time * star.speed) % 1;
        var distance = 1 - travel * 0.94;
        var x = width * (0.5 + (star.x - 0.5) * distance);
        var y = height * (0.5 + (star.y - 0.5) * distance);
        var alpha = star.alpha * smoothstep(0, 0.1, travel) * (1 - smoothstep(0.72, 1, travel)) * smoothstep(top, top + 160, y);
        if (alpha <= 0.004) continue;
        context.globalAlpha = alpha;
        context.fillStyle = tones[star.tone];
        context.beginPath();
        context.arc(x, y, star.size * (0.72 + distance * 0.42), 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function animate(time) {
      // The drift is slow: 30 fps is plenty and spares phone batteries.
      if (time - lastDraw > 32) {
        lastDraw = time;
        draw(time);
      }
      window.requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', function () {
      resize();
      draw(reducedMotion.matches ? 0 : performance.now());
    });

    if (reducedMotion.matches) {
      draw(0);
      window.addEventListener('scroll', function () {
        draw(0);
      }, { passive: true });
    } else {
      window.requestAnimationFrame(animate);
    }
  }

  fillStarfields();
  setupStarDrift();
  setupProfToggles();
  setupMeteors();
  setupPageMeteors();
  setupReveal();
  setupCountdown();
  setupScrollEffects();
}());
