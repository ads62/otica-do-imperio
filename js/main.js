/* Império dos Óculos — motion layer (GSAP + ScrollTrigger + Lenis) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // Sem GSAP (CDN bloqueada, etc.) o site continua legível.
  if (!hasGsap) root.classList.remove("js");

  /* ---------- header + menu mobile ---------- */
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  var lenis = null;

  function onScrollHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a") && toggle.getAttribute("aria-expanded") === "true") setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setMenu(false);
  });

  /* ---------- ano no rodapé ---------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  if (!hasGsap) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll (Lenis integrado ao ScrollTrigger) ---------- */
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var target = id.length > 1 && document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -60, duration: 1.4 });
        }
      });
    });
  }

  /* ---------- barra de progresso ---------- */
  var bar = document.querySelector(".progress");
  if (bar && !reduce) {
    gsap.to(bar, {
      scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.2 }
    });
  }

  if (reduce) {
    root.classList.remove("js");
    return;
  }

  /* ---------- entrada do hero: título por palavras ---------- */
  var title = document.querySelector("[data-split]");
  if (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.setAttribute("aria-label", title.textContent.trim());
    title.innerHTML = words.map(function (w) {
      return '<span class="w" aria-hidden="true"><span>' + w + "</span></span>";
    }).join(" ");
    var spans = title.querySelectorAll(".w > span");
    gsap.set(spans, { yPercent: 115 });
    gsap.set(".hero [data-hero-fade]", { autoAlpha: 0, y: 24 });
    var intro = gsap.timeline({ delay: 0.15, defaults: { ease: "expo.out" } });
    intro
      .to(spans, { yPercent: 0, duration: 1.3, stagger: 0.07 }, 0)
      .to(".hero [data-hero-fade]", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.45)
      .to(".hero [data-clip]", { clipPath: "inset(0 0 0% 0)", duration: 1.5, stagger: 0.18, ease: "power4.inOut" }, 0.1);
  }

  /* ---------- reveal por scroll ---------- */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, overwrite: true });
    }
  });

  document.querySelectorAll("[data-clip]:not(.hero [data-clip])").forEach(function (el) {
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0)", duration: 1.5, ease: "power4.inOut",
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });

  var mm = gsap.matchMedia();

  /* ---------- parallax (somente desktop/tablet largo) ---------- */
  mm.add("(min-width: 961px)", function () {
    document.querySelectorAll("[data-parallax]").forEach(function (img) {
      var amt = parseFloat(img.getAttribute("data-parallax")) || 7;
      gsap.fromTo(img, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });

    var float = document.querySelector("[data-float]");
    if (float) {
      gsap.to(float, {
        yPercent: -22, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
      });
    }
    var ring = document.querySelector(".hero__ring");
    if (ring) {
      gsap.to(ring, {
        rotate: 40, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
      });
    }
    var heroContent = document.querySelector(".hero__content");
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -8, opacity: 0.35, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
      });
    }
  });

  /* ---------- coleção: pin + scroll horizontal (desktop) ---------- */
  var collection = document.querySelector("[data-hscroll]");
  if (collection) {
    var track = collection.querySelector(".collection__track");
    var barFill = collection.querySelector(".collection__bar i");
    mm.add("(min-width: 961px)", function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: collection, start: "top top", end: function () { return "+=" + dist(); },
          pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { if (barFill) gsap.set(barFill, { scaleX: self.progress }); }
        }
      });
      return function () { gsap.set(track, { clearProps: "transform" }); };
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* ---------- cursor customizado (apenas mouse) ---------- */
  if (finePointer) {
    var ring2 = document.querySelector(".cursor");
    var dot = document.querySelector(".cursor-dot");
    if (ring2 && dot) {
      root.classList.add("has-cursor");
      var label = ring2.querySelector("span");
      var xTo = gsap.quickTo(ring2, "x", { duration: 0.5, ease: "power3" });
      var yTo = gsap.quickTo(ring2, "y", { duration: 0.5, ease: "power3" });
      var dxTo = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
      var dyTo = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });

      var onMove = function (e) {
        xTo(e.clientX); yTo(e.clientY); dxTo(e.clientX); dyTo(e.clientY);
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      document.addEventListener("mouseleave", function () { ring2.classList.add("is-hidden"); dot.style.opacity = 0; });
      document.addEventListener("mouseenter", function () { ring2.classList.remove("is-hidden"); dot.style.opacity = 1; });

      var reset = function () {
        ring2.classList.remove("is-hover", "is-button", "is-label");
        label.textContent = "";
      };
      document.addEventListener("mouseover", function (e) {
        var lab = e.target.closest("[data-cursor]");
        var btn = e.target.closest(".btn, .menu-toggle, .wa-fab");
        var lnk = e.target.closest("a, button");
        reset();
        if (lab) { label.textContent = lab.getAttribute("data-cursor"); ring2.classList.add("is-label"); }
        else if (btn) ring2.classList.add("is-button");
        else if (lnk) ring2.classList.add("is-hover");
      });

      /* botões magnéticos */
      document.querySelectorAll("[data-magnetic]").forEach(function (el) {
        var mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
        var my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
        el.addEventListener("mousemove", function (ev) {
          var r = el.getBoundingClientRect();
          mx((ev.clientX - (r.left + r.width / 2)) * 0.25);
          my((ev.clientY - (r.top + r.height / 2)) * 0.35);
        });
        el.addEventListener("mouseleave", function () { mx(0); my(0); });
      });
    }
  }
})();
