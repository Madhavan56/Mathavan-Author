/* ==========================================================================
   THE LAST BLADE — site interactions & motion systems
   ========================================================================== */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var forceMotion = /[?&]motion=force/.test(window.location.search);
  var motionOff = !forceMotion && /[?&]motion=off/.test(window.location.search);
  var reduceMotion = motionOff;

  if (motionOff) docEl.classList.add("motion-off");
  if (!motionOff) docEl.classList.add("blade-cursor");
  if (forceMotion) docEl.classList.add("motion-forced");

  /* ---------- no-js guard removal ---------- */
  docEl.classList.remove("no-js");
  docEl.classList.add("js");

  /* ============================================================
     1. Cinematic intro — curtain reveal on first visit
     ============================================================ */
  var intro = document.getElementById("intro");
  var INTRO_KEY = "tlb-intro-shown";

  function playIntro() {
    if (!intro) return finishIntro();
    document.body.classList.add("is-intro-active");
    // Force reflow so initial styles apply before the animation class
    void intro.offsetWidth;
    intro.classList.add("is-done");
    window.setTimeout(function () {
      finishIntro();
    }, reduceMotion ? 120 : 1650);
  }

  function finishIntro() {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    document.body.classList.remove("is-intro-active");
    docEl.classList.add("intro-done");
    window.dispatchEvent(new CustomEvent("tlb:intro-done"));
  }

  var seenIntro = false;
  try {
    seenIntro = window.sessionStorage.getItem(INTRO_KEY) === "1";
  } catch (e) { /* storage unavailable */ }

  if (reduceMotion || seenIntro || !intro) {
    finishIntro();
  } else {
    try { window.sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) { /* noop */ }
    playIntro();
  }

  /* ============================================================
     2. Header: hide on scroll down, show on scroll up
     ============================================================ */
  var header = document.querySelector(".site-header");
  var lastY = 0;

  function onScrollHeader() {
    if (!header) return;
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);

    if (menu && menu.classList.contains("is-open")) {
      header.classList.remove("is-hidden");
      lastY = y;
      return;
    }

    if (y > 140 && y > lastY + 4) {
      header.classList.add("is-hidden");
    } else if (y < lastY - 4 || y <= 140) {
      header.classList.remove("is-hidden");
    }
    lastY = y;
  }

  /* ============================================================
     3. Scroll progress bar
     ============================================================ */
  var progress = document.querySelector(".progress-bar");
  function onScrollProgress() {
    if (!progress) return;
    var max = docEl.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = "scaleX(" + ratio + ")";
  }

  var scrollScheduled = false;
  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(function () {
      onScrollHeader();
      onScrollProgress();
      scrollScheduled = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     4. Mobile nav
     ============================================================ */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Clickable scroll hint ---------- */
  var scrollHint = document.querySelector(".hero__scroll");
  if (scrollHint) {
    scrollHint.addEventListener("click", function () {
      var target = document.getElementById("book");
      if (!target) return;
      var y = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ============================================================
     5. Smooth anchor scrolling (Home -> top of page)
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var y = id === "#top"
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  /* ============================================================
     6. Reveal on scroll — staggered via --reveal-delay custom prop
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  var sceneEls = document.querySelectorAll(".scene");

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        var batch = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          if (!el.style.getPropertyValue("--reveal-delay")) {
            el.style.setProperty("--reveal-delay", (batch * 110) + "ms");
            batch++;
          }
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });

    // Cinematic scenes: trigger the slow zoom when a scene enters
    var sceneObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          sceneObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.28 }
    );
    sceneEls.forEach(function (el) { sceneObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    sceneEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ============================================================
     7. Hero title — split into words/lines for the rise-in effect
     ============================================================ */
  var heroTitle = document.querySelector(".hero__title");
  if (heroTitle && !heroTitle.dataset.split) {
    var words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.setAttribute("aria-label", heroTitle.textContent.trim());
    heroTitle.textContent = "";
    words.forEach(function (word, i) {
      var wrap = document.createElement("span");
      wrap.className = "hero__word";
      wrap.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "hero__word-inner";
      inner.textContent = word;
      inner.style.transitionDelay = (350 + i * 160) + "ms";
      wrap.appendChild(inner);
      heroTitle.appendChild(wrap);
      if (i < words.length - 1) heroTitle.appendChild(document.createTextNode(" "));
    });
    heroTitle.dataset.split = "1";
    window.addEventListener("tlb:intro-done", function () {
      heroTitle.classList.add("is-split-in");
    });
    // Fallback if intro never fires
    window.setTimeout(function () {
      heroTitle.classList.add("is-split-in");
    }, 2200);
  }

  /* ============================================================
     8. Book cover — 3D tilt + moving sheen
     ============================================================ */
  var frame = document.querySelector(".book__cover-frame");
  if (frame && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    if (!frame.querySelector(".book__sheen")) {
      var sheenEl = document.createElement("span");
      sheenEl.className = "book__sheen";
      frame.appendChild(sheenEl);
    }
    var sheen = frame.querySelector(".book__sheen");

    frame.addEventListener("pointermove", function (e) {
      var r = frame.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      var rx = (0.5 - py) * 10;
      var ry = (px - 0.5) * 14;
      frame.style.transform =
        "perspective(1100px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      if (sheen) {
        sheen.style.opacity = "0.35";
        sheen.style.background =
          "radial-gradient(circle at " + px * 100 + "% " + py * 100 + "%, rgba(236,229,216,0.28), transparent 55%)";
      }
    });

    frame.addEventListener("pointerleave", function () {
      frame.style.transform = "";
      if (sheen) sheen.style.opacity = "0";
    });
  }

  /* ============================================================
     9. Parallax — hero glow + CTA glow drift on scroll
     ============================================================ */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        parallaxEls.forEach(function (el) {
          var speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
          el.style.transform = "translate3d(0, " + (y * speed) + "px, 0)";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ============================================================
     10. Author's journey — reveals one by one as you scroll
     ============================================================ */
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    var tlItems = timeline.querySelectorAll(".timeline__item");

    function drawItem(item) {
      item.classList.add("is-drawn");
      var yearEl = item.querySelector("[data-count]");
      if (yearEl) runYearCounter(yearEl);
    }

    if ("IntersectionObserver" in window) {
      var tlItemObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            if (!timeline.classList.contains("has-drawn")) {
              timeline.classList.add("has-drawn");
            }
            drawItem(entry.target);
            tlItemObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      tlItems.forEach(function (item) { tlItemObserver.observe(item); });
    } else {
      timeline.classList.add("has-drawn");
      tlItems.forEach(drawItem);
    }
  }

  /* ---------- Year count-up (per milestone, on its reveal) ---------- */
  function runYearCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target) || el.dataset.counted) return;
    el.dataset.counted = "1";
    var start = 1900;
    var dur = 900;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.setTimeout(function () {
      window.requestAnimationFrame(step);
    }, 450);
  }

  /* ============================================================
     10.5 Hero rain canvas — subtle cinematic streaks
     ============================================================ */
  var rainCanvas = document.querySelector("[data-rain-canvas]");
  if (rainCanvas && rainCanvas.getContext && !reduceMotion) {
    var ctx = rainCanvas.getContext("2d");
    var hero = document.querySelector(".hero");
    var drops = [];
    var rainRunning = false;
    var rafId = null;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function sizeRainCanvas() {
      if (!hero) return;
      rainCanvas.width = hero.clientWidth * DPR * 0.5;
      rainCanvas.height = hero.clientHeight * DPR * 0.5;
      var count = Math.round(rainCanvas.width / 9);
      drops = [];
      for (var i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * rainCanvas.width,
          y: Math.random() * rainCanvas.height,
          len: (14 + Math.random() * 26) * DPR,
          speed: (700 + Math.random() * 600) * DPR * 0.5,
          drift: 60 * DPR * 0.5
        });
      }
    }

    function drawRain(dt) {
      ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
      ctx.strokeStyle = "rgba(216, 203, 182, 0.32)";
      ctx.lineWidth = DPR;
      ctx.beginPath();
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.drift * 0.06, d.y - d.len);
        d.x += d.drift * dt;
        d.y += d.speed * dt;
        if (d.y - d.len > rainCanvas.height) {
          d.y = -d.len;
          d.x = Math.random() * rainCanvas.width;
        }
      }
      ctx.stroke();
    }

    var lastT = null;
    function rainLoop(t) {
      if (!rainRunning) return;
      if (lastT === null) lastT = t;
      var dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      drawRain(dt);
      rafId = window.requestAnimationFrame(rainLoop);
    }

    function startRain() {
      if (rainRunning || !drops.length) return;
      rainRunning = true;
      lastT = null;
      rafId = window.requestAnimationFrame(rainLoop);
    }

    function stopRain() {
      rainRunning = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    }

    sizeRainCanvas();
    window.addEventListener("resize", function () {
      stopRain();
      sizeRainCanvas();
      startRain();
    });

    if ("IntersectionObserver" in window && hero) {
      var rainObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startRain();
          else stopRain();
        });
      }, { threshold: 0.05 });
      rainObserver.observe(hero);
    } else {
      startRain();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopRain();
      else if (hero) {
        var r = hero.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) startRain();
      }
    });
  }

  /* ============================================================
     10.6 Book meta rows + footer columns choreography
     ============================================================ */
  var metaList = document.querySelector(".book__meta");
  if (metaList) {
    var metaRows = metaList.querySelectorAll(".book__meta-row");
    metaRows.forEach(function (row, i) {
      row.style.setProperty("--meta-delay", (i * 180) + "ms");
    });

    if ("IntersectionObserver" in window) {
      var metaObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            metaList.classList.add("is-visible");
            metaObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.3 }
      );
      metaObserver.observe(metaList);
    } else {
      metaList.classList.add("is-visible");
    }
  }

  document.querySelectorAll(".footer__col").forEach(function (col, i) {
    col.style.setProperty("--reveal-delay", (i * 160) + "ms");
    var kids = col.children;
    for (var k = 0; k < kids.length; k++) {
      kids[k].style.setProperty("--child-i", String(k));
    }
  });

  /* ---------- Copy email (newsletter card) ---------- */
  var copyBtn = document.querySelector("[data-copy-email]");
  var feedback = document.querySelector("[data-copy-feedback]");

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  if (copyBtn && feedback) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      function done(ok) {
        feedback.textContent = ok ? "Email copied to clipboard." : "";
        if (ok) {
          copyBtn.textContent = "Copied";
          window.setTimeout(function () {
            copyBtn.textContent = "Copy";
            feedback.textContent = "";
          }, 2400);
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () { done(true); },
          function () { done(fallbackCopy(email)); }
        );
      } else {
        done(fallbackCopy(email));
      }
    });
  }

  /* ---------- Footer version tag ---------- */
  var versionEl = document.querySelector("[data-version]");
  if (versionEl) {
    versionEl.textContent = "Site version " + (window.SITE_VERSION || "dev");
  }

  /* ============================================================
     12. FAQ accordion
     ============================================================ */
  document.querySelectorAll(".faq-item__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var answer = document.getElementById(q.getAttribute("aria-controls"));
      var open = q.getAttribute("aria-expanded") === "true";
      // close others
      document.querySelectorAll(".faq-item__q[aria-expanded='true']").forEach(function (other) {
        if (other !== q) {
          other.setAttribute("aria-expanded", "false");
          var otherA = document.getElementById(other.getAttribute("aria-controls"));
          if (otherA) otherA.style.maxHeight = "0px";
        }
      });
      q.setAttribute("aria-expanded", open ? "false" : "true");
      if (answer) answer.style.maxHeight = open ? "0px" : answer.scrollHeight + "px";
    });
  });

  /* ============================================================
     13. Forms — contact + newsletter via Web3Forms
     ============================================================ */
  function wireForm(form, statusEl, successMsg, noteEl) {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (statusEl) statusEl.textContent = "Sending\u2026";
      var data = new FormData(form);
      fetch(form.getAttribute("action"), {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result && result.success) {
            if (statusEl) statusEl.textContent = successMsg;
            form.reset();
          } else {
            if (statusEl) statusEl.textContent = "Something went wrong — please email madhavan4356@gmail.com directly.";
          }
        })
        .catch(function () {
          if (statusEl) statusEl.textContent = "Network error — please email madhavan4356@gmail.com directly.";
        });
    });
  }

  wireForm(
    document.querySelector("[data-contact-form]"),
    document.querySelector("[data-contact-form] [data-form-status]"),
    "Message sent — the author will reply soon. Thank you!"
  );

  (function () {
    var nlForm = document.querySelector("[data-newsletter-form]");
    if (!nlForm) return;
    var note = nlForm.parentNode.querySelector(".newsletter__note");
    wireForm(nlForm, null, "", note);
  })();

  /* ============================================================
     11. Active nav link per section
     ============================================================ */
  var navMap = [
    { el: document.getElementById("home"), link: document.querySelector('.nav__link[href="#top"]') },
    { el: document.getElementById("book"), link: document.querySelector('.nav__link[href="#book"]') },
    { el: document.getElementById("about"), link: document.querySelector('.nav__link[href="#about"]') },
    { el: document.getElementById("contact"), link: document.querySelector('.nav__link[href="#contact"]') }
  ].filter(function (s) { return s.el && s.link; });

  /* ---------- Section divider draw-in ---------- */
  var allSections = document.querySelectorAll("main .section");
  if ("IntersectionObserver" in window && allSections.length) {
    var divObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-lit");
            divObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    allSections.forEach(function (s) { divObserver.observe(s); });
  }

  /* ============================================================
     11. Active nav link per section
     ============================================================ */
  if ("IntersectionObserver" in window && navMap.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navMap.forEach(function (s) {
            s.link.classList.toggle("is-active", s.el === entry.target);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    navMap.forEach(function (s) { navObserver.observe(s.el); });
  }
})();
