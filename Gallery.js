(function () {
  'use strict';

  // Layout is expressed in the 1080x1920 space of the original reel.
  var W = 1080;
  var H = 1920;
  var CX = 540;
  var CY = 960;
  var R = 504;
  var RING_W = 10;
  var CHUTE_HALF = 61;
  var WALL_W = 7;
  var CHUTE_BOTTOM = CY - Math.sqrt(R * R - CHUTE_HALF * CHUTE_HALF);
  var CHUTE_SPEED = 560;
  var SPAWN_EVERY = 0.4;
  var ATTRACT = 120;
  var MAX_TIER = 7;
  var LOOP_AFTER = 9;
  var ASSET_V = '20261101-1';
  var BG = '#090920';
  var FONT = '"Open Sans", "Helvetica Neue", Arial, sans-serif';

  var SIZES = [[77, 86], [100, 113], [123, 154], [170, 195], [200, 193], [273, 236], [229, 269], [587, 519]];
  var RADII = SIZES.map(function (s) { return (s[0] + s[1]) / 4 * 0.95; });
  var COLORS = ['#ffffff', '#f3e2a6', '#dcec9a', '#9fe8b8', '#8fdcf2', '#9fb0ff', '#c9a2ff', '#ffb0e4'];
  // Indexed by the tier that was just created.
  var SOUNDS = [null, ['meow-2a', 'meow-2b'], ['meow-3'], ['meow-4'], ['meow-5a', 'meow-5b'], ['meow-6'], ['meow-7'], ['meow-7']];
  // Twinkles drawn on the last cat, in its sprite pixels: [x, y, starts as "x" instead of "+"].
  var SPARKLES = [[131, 175, 0], [131, 321, 0], [131, 467, 0], [242, 102, 1], [242, 248, 1], [242, 394, 1],
    [354, 175, 0], [354, 321, 0], [354, 467, 0], [466, 248, 1], [466, 394, 1]];

  function easeOutBack(p) {
    var c1 = 1.70158;
    var q = p - 1;
    return 1 + (c1 + 1) * q * q * q + c1 * q * q;
  }

  function easeOutCubic(p) {
    var q = 1 - p;
    return 1 - q * q * q;
  }

  function createSim(random) {
    random = random || Math.random;
    var unlocked = [0];
    for (var i = 1; i <= MAX_TIER; i++) unlocked.push(-1);

    var s = {
      t: 0,
      cats: [],
      rings: [],
      parts: [],
      banners: [],
      events: [],
      flash: null,
      score: 0,
      shown: 0,
      bump: -1,
      unlocked: unlocked,
      spawnIn: 0,
      finaleAt: -1,
      done: false
    };

    function fill() {
      var area = 0;
      for (var i = 0; i < s.cats.length; i++) area += s.cats[i].r * s.cats[i].r;
      return area / (R * R);
    }

    function spawn() {
      s.cats.push({ tier: 0, x: CX, y: -60, vx: 0, vy: CHUTE_SPEED, a: 0, av: 0, r: RADII[0], born: -1, chute: true });
    }

    function keepInside(c) {
      var dx = c.x - CX;
      var dy = c.y - CY;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var lim = R - RING_W / 2 - c.r;
      if (d <= lim) return;
      var nx = dx / d;
      var ny = dy / d;
      c.x = CX + nx * lim;
      c.y = CY + ny * lim;
      var vn = c.vx * nx + c.vy * ny;
      if (vn > 0) {
        c.vx -= 2 * vn * nx;
        c.vy -= 2 * vn * ny;
        var vt = -c.vx * ny + c.vy * nx;
        c.av += vt / c.r * 0.12;
      }
    }

    function addRing(x, y, r0, r1, w, color, alpha, delay, dur) {
      s.rings.push({ x: x, y: y, r0: r0, r1: r1, w: w, color: color, alpha: alpha, t0: s.t + delay, dur: dur });
    }

    function addParts(x, y, n, colorAt, speedMin, speedMax, lifeMin, lifeMax, sizeMin, sizeMax) {
      for (var i = 0; i < n; i++) {
        var ang = random() * Math.PI * 2;
        var sp = speedMin + random() * (speedMax - speedMin);
        s.parts.push({
          x: x, y: y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          size: sizeMin + random() * (sizeMax - sizeMin),
          rot: random() * Math.PI, vr: (random() - 0.5) * 8,
          color: colorAt(i), t0: s.t, life: lifeMin + random() * (lifeMax - lifeMin)
        });
      }
    }

    function celebrate(c) {
      var t = c.tier;
      var col = COLORS[t];
      var r = c.r;
      addRing(c.x, c.y, r * 0.55, r * 1.3, 8, col, 0.95, 0, 0.45);
      if (t >= 2) addRing(c.x, c.y, r * 0.9, r * 2.3, r * 0.4, col, 0.3, 0, 0.8);
      if (t >= 5) {
        addRing(c.x, c.y, r, r * 3, r * 0.5, col, 0.28, 0.12, 1);
        addRing(c.x, c.y, r, r * 3.6, r * 0.5, col, 0.22, 0.28, 1.2);
        s.flash = { color: col, t0: s.t, dur: 0.7, alpha: t >= 6 ? 0.26 : 0.16 };
      }
      if (t >= 6) {
        s.banners = [{
          text: 'LEVEL ' + (t + 1) + '!',
          x: Math.max(330, Math.min(W - 330, c.x)),
          y: Math.max(260, Math.min(1420, c.y)),
          t0: s.t,
          fill: t === MAX_TIER ? '#ffd3f1' : '#efd2ff',
          stroke: t === MAX_TIER ? '#7a2f64' : '#5b3480'
        }];
      }
      addParts(c.x, c.y, 8 + t * 4, function () { return col; }, 120, 420, 0.5, 1, 6, 12);
      if (t === MAX_TIER) {
        for (var k = 0; k < 5; k++) addRing(c.x, c.y, r * 0.6, 1100, 110, '#ffb8e8', 0.45, k * 0.16, 1.7);
        addParts(c.x, c.y, 180, function () {
          return 'hsl(' + Math.floor(random() * 360) + ', 95%, 60%)';
        }, 200, 900, 1.5, 2.8, 10, 18);
      }
    }

    function merge(a, b) {
      var ma = a.r * a.r;
      var mb = b.r * b.r;
      var tot = ma + mb;
      var t = a.tier + 1;
      var c = {
        tier: t,
        x: (a.x * ma + b.x * mb) / tot,
        y: (a.y * ma + b.y * mb) / tot,
        vx: (a.vx * ma + b.vx * mb) / tot,
        vy: (a.vy * ma + b.vy * mb) / tot,
        a: (a.a + b.a) / 2,
        av: (random() - 0.5) * 2,
        r: RADII[t],
        born: s.t,
        chute: false
      };
      a.dead = true;
      b.dead = true;
      keepInside(c);
      s.cats.push(c);
      s.score += 10 * Math.pow(2, t + 1);
      s.bump = s.t;
      if (s.unlocked[t] < 0) s.unlocked[t] = s.t;
      if (t === MAX_TIER && s.finaleAt < 0) s.finaleAt = s.t;
      s.events.push({ tier: t, x: c.x, y: c.y });
      celebrate(c);
    }

    function moveCat(c, dt) {
      if (c.chute) {
        c.y += CHUTE_SPEED * dt;
        if (c.y >= CHUTE_BOTTOM + c.r + 6) {
          c.chute = false;
          c.vx = (random() - 0.5) * 160;
          c.vy = 380 + random() * 80;
          c.av = (random() - 0.5) * 2.4;
        }
        return;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.a += c.av * dt;
      c.av = Math.max(-4, Math.min(4, c.av));

      var sp = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      var vmin = 190 - 14 * c.tier;
      var vmax = 520;
      if (sp < 1) {
        var ang = random() * Math.PI * 2;
        c.vx = Math.cos(ang) * vmin;
        c.vy = Math.sin(ang) * vmin;
      } else if (sp < vmin) {
        var up = 1 + (vmin / sp - 1) * Math.min(1, dt * 1.5);
        c.vx *= up;
        c.vy *= up;
      } else if (sp > vmax) {
        var down = 1 - (1 - vmax / sp) * Math.min(1, dt * 2);
        c.vx *= down;
        c.vy *= down;
      }
      keepInside(c);
    }

    // Same cats drift toward each other a little, otherwise the last big pair can take minutes to meet.
    function attract(dt) {
      var cats = s.cats;
      for (var i = 0; i < cats.length; i++) {
        var a = cats[i];
        if (a.chute || a.tier >= MAX_TIER) continue;
        var best = null;
        var bestD2 = Infinity;
        for (var j = 0; j < cats.length; j++) {
          var b = cats[j];
          if (j === i || b.chute || b.tier !== a.tier) continue;
          var d2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
          if (d2 < bestD2) {
            bestD2 = d2;
            best = b;
          }
        }
        if (!best) continue;
        var d = Math.sqrt(bestD2) || 1;
        a.vx += (best.x - a.x) / d * ATTRACT * dt;
        a.vy += (best.y - a.y) / d * ATTRACT * dt;
      }
    }

    function collide() {
      var cats = s.cats;
      for (var i = 0; i < cats.length; i++) {
        var a = cats[i];
        if (a.chute || a.dead) continue;
        for (var j = i + 1; j < cats.length; j++) {
          var b = cats[j];
          if (b.chute || b.dead) continue;
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var rr = a.r + b.r;
          var d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (a.tier === b.tier && a.tier < MAX_TIER) {
            merge(a, b);
            break;
          }
          var d = Math.sqrt(d2) || 0.01;
          var nx = dx / d;
          var ny = dy / d;
          var ma = a.r * a.r;
          var mb = b.r * b.r;
          var overlap = rr - d;
          a.x -= nx * overlap * mb / (ma + mb);
          a.y -= ny * overlap * mb / (ma + mb);
          b.x += nx * overlap * ma / (ma + mb);
          b.y += ny * overlap * ma / (ma + mb);
          var rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rvn < 0) {
            var imp = -1.9 * rvn / (1 / ma + 1 / mb);
            a.vx -= imp * nx / ma;
            a.vy -= imp * ny / ma;
            b.vx += imp * nx / mb;
            b.vy += imp * ny / mb;
            var rvt = -(b.vx - a.vx) * ny + (b.vy - a.vy) * nx;
            a.av += rvt / a.r * 0.08;
            b.av -= rvt / b.r * 0.08;
          }
        }
      }
      s.cats = cats.filter(function (c) { return !c.dead; });
    }

    function step(dt) {
      s.t += dt;
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        s.spawnIn += SPAWN_EVERY;
        if (fill() < 0.5) spawn();
      }
      attract(dt);
      for (var i = 0; i < s.cats.length; i++) moveCat(s.cats[i], dt);
      collide();

      var drag = Math.pow(0.12, dt);
      s.parts = s.parts.filter(function (p) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= drag;
        p.vy *= drag;
        p.rot += p.vr * dt;
        return s.t - p.t0 < p.life;
      });
      s.rings = s.rings.filter(function (r) { return s.t - r.t0 < r.dur; });
      s.banners = s.banners.filter(function (b) { return s.t - b.t0 < 1.7; });
      s.shown += (s.score - s.shown) * Math.min(1, dt * 5);
      if (s.finaleAt >= 0 && s.t - s.finaleAt > LOOP_AFTER) s.done = true;
    }

    s.update = function (dt) {
      var n = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (var i = 0; i < n; i++) step(dt / n);
    };
    return s;
  }

  function createAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    var api = { on: false, enable: function () {}, disable: function () {}, play: function () {} };
    if (!AC) return api;

    var ctx = new AC();
    var out = ctx.createGain();
    out.connect(ctx.destination);
    var buffers = {};
    var current = null;

    SOUNDS.forEach(function (list) {
      (list || []).forEach(function (name) {
        if (buffers[name] !== undefined) return;
        buffers[name] = null;
        fetch('sounds/hmc/' + name + '.mp3?v=' + ASSET_V)
          .then(function (res) { return res.arrayBuffer(); })
          .then(function (data) {
            return new Promise(function (resolve, reject) { ctx.decodeAudioData(data, resolve, reject); });
          })
          .then(function (buffer) { buffers[name] = buffer; })
          .catch(function () {});
      });
    });

    function stopCurrent() {
      if (!current) return;
      try { current.src.stop(); } catch (e) { /* already stopped */ }
      current = null;
    }

    api.enable = function () {
      api.on = true;
      if (navigator.audioSession) {
        try { navigator.audioSession.type = 'playback'; } catch (e) { /* unsupported */ }
      }
      if (ctx.state !== 'running') ctx.resume();
    };

    api.disable = function () {
      api.on = false;
      stopCurrent();
    };

    // One meow at a time, like the reel: a bigger cat interrupts a smaller one, otherwise wait.
    api.play = function (tier) {
      if (!api.on || ctx.state !== 'running') return;
      var list = SOUNDS[tier];
      if (!list) return;
      var now = ctx.currentTime;
      if (current && now < current.end + 0.12 && tier <= current.tier) return;
      var buffer = buffers[list[Math.floor(Math.random() * list.length)]];
      if (!buffer) return;
      stopCurrent();
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(out);
      src.start();
      current = { src: src, tier: tier, end: now + buffer.duration };
    };

    return api;
  }

  function drawSparkles(ctx, t) {
    var sz = SIZES[MAX_TIER];
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    SPARKLES.forEach(function (p, i) {
      var alpha = 0.4 + 0.25 * Math.sin(t * 3 + i * 1.7);
      ctx.save();
      ctx.translate(p[0] - sz[0] / 2, p[1] - sz[1] / 2);
      ctx.rotate(p[2] * Math.PI / 4 + t * 0.9);
      ctx.strokeStyle = 'rgba(205, 205, 215, ' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(26, 0);
      ctx.moveTo(0, -26);
      ctx.lineTo(0, 26);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawCat(ctx, s, c, imgs) {
    var img = imgs[c.tier];
    if (!img.complete || !img.naturalWidth) return;
    var sz = SIZES[c.tier];
    var k = 1;
    if (c.born >= 0 && s.t - c.born < 0.32) k = 0.3 + 0.7 * easeOutBack((s.t - c.born) / 0.32);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.a);
    ctx.scale(k, k);
    ctx.drawImage(img, -sz[0] / 2, -sz[1] / 2, sz[0], sz[1]);
    if (c.tier === MAX_TIER) drawSparkles(ctx, s.t);
    ctx.restore();
  }

  function drawRing(ctx, t) {
    var gap = Math.asin((CHUTE_HALF + WALL_W / 2) / R);
    var start = -Math.PI / 2 + gap;
    var span = Math.PI * 2 - gap * 2;
    var base = 208 + 52 * t;
    ctx.lineWidth = RING_W;
    ctx.lineCap = 'butt';
    if (ctx.createConicGradient) {
      var grad = ctx.createConicGradient(0, CX, CY);
      for (var k = 0; k <= 24; k++) {
        grad.addColorStop(k / 24, 'hsl(' + ((base + 15 * k) % 360).toFixed(1) + ', 100%, 55%)');
      }
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.arc(CX, CY, R, start, start + span);
      ctx.stroke();
    } else {
      var segs = 180;
      for (var i = 0; i < segs; i++) {
        var a0 = start + span * i / segs;
        var hue = ((a0 * 180 / Math.PI + base) % 360 + 360) % 360;
        ctx.strokeStyle = 'hsl(' + hue.toFixed(1) + ', 100%, 55%)';
        ctx.beginPath();
        ctx.arc(CX, CY, R, a0, a0 + span / segs + 0.004);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = WALL_W;
    ctx.beginPath();
    ctx.moveTo(CX - CHUTE_HALF, 0);
    ctx.lineTo(CX - CHUTE_HALF, CHUTE_BOTTOM + 2);
    ctx.moveTo(CX + CHUTE_HALF, 0);
    ctx.lineTo(CX + CHUTE_HALF, CHUTE_BOTTOM + 2);
    ctx.stroke();
  }

  function drawEffects(ctx, s) {
    s.rings.forEach(function (r) {
      var age = s.t - r.t0;
      if (age < 0) return;
      var p = age / r.dur;
      ctx.globalAlpha = r.alpha * (1 - p);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1, r.w * (1 - 0.5 * p));
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * easeOutCubic(p), 0, Math.PI * 2);
      ctx.stroke();
    });

    s.parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - (s.t - p.t0) / p.life);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    s.banners.forEach(function (b) {
      var age = s.t - b.t0;
      var k = age < 0.25 ? 0.4 + 0.6 * easeOutBack(age / 0.25) : 1;
      ctx.globalAlpha = age < 0.9 ? 1 : Math.max(0, 1 - (age - 0.9) / 0.8);
      ctx.save();
      ctx.translate(b.x, b.y - 30 * age);
      ctx.scale(k, k);
      ctx.font = '800 128px ' + FONT;
      ctx.lineWidth = 10;
      ctx.strokeStyle = b.stroke;
      ctx.strokeText(b.text, 0, 0);
      ctx.fillStyle = b.fill;
      ctx.fillText(b.text, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function drawHud(ctx, s, imgs) {
    var bumpAge = s.t - s.bump;
    var k = s.bump >= 0 && bumpAge < 0.25 ? 1 + 0.06 * (1 - bumpAge / 0.25) : 1;
    ctx.save();
    ctx.translate(CX, 1561);
    ctx.scale(k, k);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 92px ' + FONT;
    ctx.fillText('SCORE: ' + Math.round(s.shown).toLocaleString('en-US'), 0, 0);
    ctx.restore();

    for (var i = 0; i <= MAX_TIER; i++) {
      var x = 176 + 104 * i;
      var y = 1682;
      var r = 44;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.stroke();

      var at = s.unlocked[i];
      var img = imgs[i];
      if (at < 0 || !img.complete || !img.naturalWidth) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 38px ' + FONT;
        ctx.fillText('?', x, y + 2);
        continue;
      }
      var age = s.t - at;
      var pop = i > 0 && age < 0.35 ? 0.3 + 0.7 * easeOutBack(age / 0.35) : 1;
      var sz = SIZES[i];
      var fit = (r * 2 - 8) / Math.max(sz[0], sz[1]) * pop;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r - 3, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - sz[0] * fit / 2, y - sz[1] * fit / 2, sz[0] * fit, sz[1] * fit);
      ctx.restore();
    }
  }

  function render(ctx, s, imgs) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    if (s.flash) {
      var age = s.t - s.flash.t0;
      if (age < s.flash.dur) {
        ctx.globalAlpha = s.flash.alpha * (1 - age / s.flash.dur);
        ctx.fillStyle = s.flash.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    var order = s.cats.slice().sort(function (a, b) { return b.tier - a.tier; });
    order.forEach(function (c) { drawCat(ctx, s, c, imgs); });
    drawRing(ctx, s.t);
    drawEffects(ctx, s);
    drawHud(ctx, s, imgs);
  }

  function boot() {
    var stage = document.getElementById('hmc-stage');
    var canvas = document.getElementById('hmc-canvas');
    var button = document.getElementById('hmc-sound');
    if (!stage || !canvas) return;
    var ctx = canvas.getContext('2d');
    var label = button && button.querySelector('[data-sound-label]');
    var audio = createAudio();
    var touched = false;

    var imgs = SIZES.map(function (_, i) {
      var img = new Image();
      img.src = 'images/hmc/cat-' + (i + 1) + '.webp?v=' + ASSET_V;
      return img;
    });

    function setSound(on) {
      touched = true;
      if (on) audio.enable(); else audio.disable();
      if (!button) return;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (label) label.textContent = on ? 'Couper le son' : 'Activer le son';
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        setSound(!audio.on);
      });
    }
    stage.addEventListener('click', function () {
      if (!touched) setSound(true);
    });

    var scale = 1;
    function resize() {
      var rect = stage.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      scale = canvas.width / W;
    }
    resize();
    window.addEventListener('resize', resize);

    var sim = createSim();
    var fadeOut = -1;
    var fadeIn = 0;
    var last = null;

    function frame(ts) {
      var dt = last === null ? 0 : Math.min((ts - last) / 1000, 1 / 20);
      last = ts;
      sim.update(dt);
      sim.events.splice(0).forEach(function (e) { audio.play(e.tier); });

      if (sim.done && fadeOut < 0) fadeOut = 0;
      if (fadeOut >= 0) {
        fadeOut += dt;
        if (fadeOut >= 1) {
          sim = createSim();
          fadeOut = -1;
          fadeIn = 0;
        }
      }
      fadeIn += dt;

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      render(ctx, sim, imgs);
      var dark = fadeOut >= 0 ? fadeOut : Math.max(0, 1 - fadeIn / 0.8);
      if (dark > 0) {
        ctx.globalAlpha = dark;
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { createSim: createSim };
  } else {
    boot();
  }
})();
