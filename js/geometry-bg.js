/* ============================================================
   WAVE INTERFERENCE PARTICLE FIELD
   Faithfully replicates zhihuishu.com login page effect:
   - 3D perspective-projected particle grid
   - sin(ix * 0.3 + t) * 50 + sin(iy * 0.5 + t) * 50 wave
   - Particle size oscillates in sync with wave height
   - Camera gently follows mouse (parallax)
   - Zero dependencies. Vanilla JS + Canvas 2D.
   ============================================================ */
(function() {
  function boot() {
    if (!document.body) { setTimeout(boot, 80); return; }

    /* ---- canvas ---- */
    var canvas = document.createElement('canvas');
    canvas.id = 'wave-particles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;top:0;left:0;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    var ctx = canvas.getContext('2d');
    var W, H, centerX, centerY;
    var particles = [];
    var count = 0;            // phase accumulator (zhihuishu's "count += 0.08")
    var rafId;

    /* ---- mouse with lerp (zhihuishu's camera follow) ---- */
    var mouseX = 0, mouseY = 0;     // target
    var camX = 0, camY = 0;         // current (lerped)
    var windowHalfX, windowHalfY;

    /* ---- reduced motion ---- */
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e) {
      reducedMotion = e.matches;
      if (!reducedMotion) count = 0;
    });

    /* ---- dark mode ---- */
    function isDark() {
      var s = document.documentElement.getAttribute('data-user-color-scheme');
      if (s === 'dark') return true;
      if (s === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /* ==================================================================
       GRID SEEDING — like zhihuishu's 50×50 grid on XZ plane.
       We use a flat array with {ix, iy} indices so the wave formula
       references grid coordinates, not screen pixels.
       ================================================================== */
    var SPACING = 110;  // world-unit spacing
    var COLS = 60;      // 60×28 = 1680 particles (2/3 of original 2470)
    var ROWS = 28;

    function seed() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
      centerX = W / 2;
      centerY = H / 2;
      windowHalfX = W / 2;
      windowHalfY = H / 1;

      // World X spans ±30*110 = ±3300, Z spans ±14*110 = ±1540.
      // At far depth + parallax, screen half-width = 3300×0.357 ≈ 1178 > 960.
      particles = [];
      for (var ix = 0; ix < COLS; ix++) {
        for (var iy = 0; iy < ROWS; iy++) {
          particles.push({
            ix: ix,
            iy: iy,
            wx: (ix - COLS / 2) * SPACING,
            wz: (iy - ROWS / 2) * SPACING
          });
        }
      }
    }

    /* ==================================================================
       PERSPECTIVE PROJECTION
       Simulates Three.js PerspectiveCamera at z=1000, FOV 75°.
       Grid lies on XZ plane; wave displaces Y (height).
       Camera pans with mouse.
       ================================================================== */
    var CAMERA_Z = 3000;       // camera distance — larger = subtler perspective, better coverage
    var FOCAL;                 // derived from FOV + viewport

    function project(wx, wy, wz) {
      // Camera-relative depth
      // In zhihuishu: camera at z=1000, particles at z range [-2500, +2450]
      // depth = wz - (-CAMERA_Z) for Three.js convention...
      // Simplified: depth = CAMERA_Z + wz  (always >0)
      var depth = CAMERA_Z + wz;
      if (depth < 1) depth = 1;

      // Focal length: H*1.5 gives ~37° FOV (narrower than zhihuishu's 75°).
      // This "zooms in" so the grid fills the viewport even at far depths.
      if (!FOCAL) FOCAL = H * 1.5;

      var scale = FOCAL / depth;

      // Vertical shift: push the field down so bottom edge hugs viewport bottom.
      var shiftY = H * 0.50;

      // Project: camera looks from (camX, camY, CAMERA_Z) toward (0, 0, 0)
      var sx = centerX + (wx - camX) * scale;
      var sy = centerY + shiftY + (wy - camY) * scale;

      return { sx: sx, sy: sy, scale: scale };
    }

    /* ==================================================================
       UPDATE — zhihuishu wave formula + camera lerp
       ================================================================== */
    function update() {
      if (!reducedMotion) {
        count += 0.08;   // zhihuishu's exact phase step
      }

      // Camera lerp toward mouse (reduced from 0.05 → 0.04 for better edge coverage)
      camX += (mouseX - camX) * 0.04;
      camY += (-mouseY - camY) * 0.04;
    }

    /* ==================================================================
       DRAW
       ================================================================== */
    function draw() {
      ctx.clearRect(0, 0, W, H);

      var dark = isDark();
      var dotColor = dark ? '180,175,168' : '140,135,125';

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // ── zhihuishu wave formula (EXACT) ──
        var waveY = Math.sin((p.ix + count) * 0.3) * 50
                  + Math.sin((p.iy + count) * 0.5) * 50;

        // ── zhihuishu size oscillation (EXACT) ──
        var sizeOsc = (Math.sin((p.ix + count) * 0.3) + 1) * 2
                    + (Math.sin((p.iy + count) * 0.5) + 1) * 2;
        // sizeOsc ranges 0 ~ 8

        // ── perspective projection ──
        var proj = project(p.wx, waveY, p.wz);

        // Skip off-screen particles
        if (proj.sx < -30 || proj.sx > W + 30 ||
            proj.sy < -30 || proj.sy > H + 30) continue;

        // ── radius: base * perspective-scale * wave-oscillation ──
        var radius = 3.2 * proj.scale * (sizeOsc * 0.2 + 0.7);
        radius = Math.max(0.4, Math.min(radius, 7));

        // ── opacity: driven by wave height, NOT perspective (zhihuishu uses uniform color) ──
        var alpha = 0.28 + sizeOsc * 0.025;
        alpha = Math.max(0.08, Math.min(alpha, dark ? 0.48 : 0.55));

        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + dotColor + ',' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    /* ==================================================================
       LOOP
       ================================================================== */
    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    /* ==================================================================
       EVENTS
       ================================================================== */
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX - windowHalfX;
      mouseY = e.clientY - windowHalfY;
    });

    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        FOCAL = null;  // recalc
        seed();
      }, 250);
    });

    /* ---- start ---- */
    seed();
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
