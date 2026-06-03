/* global Fluid */

Fluid.boot = {};

Fluid.boot.registerEvents = function() {
  Fluid.events.billboard();
  Fluid.events.registerNavbarEvent();
  Fluid.events.registerParallaxEvent();
  Fluid.events.registerScrollDownArrowEvent();
  Fluid.events.registerScrollTopArrowEvent();
  Fluid.events.registerImageLoadedEvent();
};

Fluid.boot.refresh = function() {
  Fluid.plugins.fancyBox();
  Fluid.plugins.codeWidget();
  Fluid.events.refresh();
};

document.addEventListener('DOMContentLoaded', function() {
  Fluid.boot.registerEvents();
});

/* ============================================================
   CUSTOM CURSOR — clean dark dot, all pages
   ============================================================ */
(function() {
  if (!document.body) return;

  var dot = document.createElement('div');
  dot.id = 'custom-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var cx = tx, cy = ty;
  var visible = false;

  document.addEventListener('mousemove', function(e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity = '1';
    }
  });

  document.addEventListener('mouseleave', function() {
    dot.style.opacity = '0';
    visible = false;
  });

  document.addEventListener('mouseenter', function() {
    visible = true;
    dot.style.opacity = '1';
  });

  function follow() {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
    requestAnimationFrame(follow);
  }

  follow();
})();
