/* =========================================================
   PIXRAW PRODUCTION — MAIN JAVASCRIPT
   Navigation · Cinematic hero · Reveal · Portfolio · Dialog
   No dependencies. Progressive enhancement.
   ========================================================= */

document.documentElement.classList.add("js");

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------
     CURRENT YEAR
  --------------------------------------------- */

  const setCurrentYear = () => {
    const year = String(new Date().getFullYear());
    $$("[data-year], .current-year").forEach((element) => {
      element.textContent = year;
    });
  };

  /* ---------------------------------------------
     HEADER SCROLL STATE
  --------------------------------------------- */

  const initHeader = () => {
    const header = $(".site-header");
    if (!header) return;

    let ticking = false;

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    };

    update();
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
  };

  /* ---------------------------------------------
     MOBILE NAVIGATION
  --------------------------------------------- */

  const initMobileNavigation = () => {
    const toggle = $(".nav-toggle");
    const menu = $("#mobile-menu");
    const closeButton = $(".mobile-menu__close", menu || document);
    if (!toggle || !menu) return;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    let lastFocused = null;

    const getFocusable = () => $$(focusableSelector, menu)
      .filter((element) => element === closeButton || element.getClientRects().length > 0);

    const openMenu = () => {
      lastFocused = document.activeElement;
      menu.hidden = false;
      menu.removeAttribute("inert");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      const toggleLabel = toggle.querySelector("span:not(.nav-toggle__icon)");
      if (toggleLabel) toggleLabel.textContent = "Close";
      document.body.classList.add("is-locked");

      // Flush the closed state so the open transition still runs, then open
      // synchronously instead of depending on a throttled animation frame.
      void menu.offsetWidth;
      menu.classList.add("is-open");

      const focusFirst = () => {
        const first = getFocusable()[0];
        if (first) first.focus({ preventScroll: true });
      };

      // The menu fades in; focus can only land once it is visible.
      window.setTimeout(focusFirst, 60);
    };

    const closeMenu = ({ returnFocus = true } = {}) => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      menu.setAttribute("inert", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      const toggleLabel = toggle.querySelector("span:not(.nav-toggle__icon)");
      if (toggleLabel) toggleLabel.textContent = "Menu";
      document.body.classList.remove("is-locked");

      if (returnFocus) {
        const target = lastFocused instanceof HTMLElement && lastFocused !== document.body
          ? lastFocused
          : toggle;
        target.focus({ preventScroll: true });
      }
    };

    // Initial state
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("inert", "");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeButton) {
      closeButton.addEventListener("click", () => closeMenu());
    }

    $$("a", menu).forEach((link) => {
      link.addEventListener("click", () => closeMenu({ returnFocus: false }));
    });

    document.addEventListener("keydown", (event) => {
      const isOpen = menu.classList.contains("is-open");
      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && menu.classList.contains("is-open")) {
        closeMenu({ returnFocus: false });
      }
    }, { passive: true });
  };

  /* ---------------------------------------------
     CINEMATIC HERO — EIGHT SCENES
  --------------------------------------------- */

  const initHero = () => {
    const hero = $(".hero");
    if (!hero) return;

    const layerA = $("[data-hero-layer='a']", hero);
    const layerB = $("[data-hero-layer='b']", hero);
    const imageA = layerA ? $("img", layerA) : null;
    const imageB = layerB ? $("img", layerB) : null;
    const counter = $("[data-scene-current]", hero);
    const toggle = $("[data-scene-toggle]", hero);
    const dots = $$("[data-scene]", hero);

    if (!layerA || !layerB || !imageA || !imageB) return;

    const scenes = [
      { base: "pixraw-scene-01-camera-lens", alt: "Camera lens and production studio" },
      { base: "pixraw-scene-02-camera-setup", alt: "Cinema camera setup in a studio" },
      { base: "pixraw-scene-03-film-production", alt: "Film production set with monitors" },
      { base: "pixraw-scene-04-creative-workspace", alt: "Creative production workspace" },
      { base: "pixraw-scene-05-digital-marketing", alt: "Digital marketing dashboards" },
      { base: "pixraw-scene-06-graphic-design", alt: "Graphic design workspace" },
      { base: "pixraw-scene-07-web-interface", alt: "Website interface design" },
      { base: "pixraw-scene-08-orange-light", alt: "PIXRAW cinematic studio scene" }
    ];

    const webp = (scene, width) =>
      `assets/video/webp/${scene.base}-${width}.webp`;
    const fallback = (scene) => `assets/video/${scene.base}.png`;

    let current = 0;
    let activeLayer = "a";
    let paused = reducedMotion.matches;
    let inView = true;
    let timer = null;
    let transitionToken = 0;
    let preloaded = new Map();

    const pad = (number) => String(number + 1).padStart(2, "0");

    const updateInterface = () => {
      if (counter) counter.textContent = pad(current);

      dots.forEach((dot, index) => {
        const active = index === current;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (toggle) {
        toggle.textContent = paused ? "▶" : "Ⅱ";
        toggle.setAttribute("aria-label", paused ? "Play scene sequence" : "Pause scene sequence");
        toggle.setAttribute("aria-pressed", String(!paused));
      }
    };

    const preloadScene = (index) => {
      if (preloaded.has(index)) return preloaded.get(index);

      const scene = scenes[index];
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load ${scene.base}`));
        image.srcset = `${webp(scene, 960)} 960w, ${webp(scene, 1920)} 1920w`;
        image.sizes = "100vw";
        image.src = fallback(scene);
      });

      preloaded.set(index, promise);
      return promise;
    };

    const setImageSource = (image, index) => {
      const scene = scenes[index];
      image.srcset = `${webp(scene, 960)} 960w, ${webp(scene, 1920)} 1920w`;
      image.sizes = "100vw";
      image.src = fallback(scene);
      image.alt = "";
      image.decoding = "async";
    };

    const showScene = async (index) => {
      if (index === current) return;

      const token = ++transitionToken;
      const nextLayer = activeLayer === "a" ? layerB : layerA;
      const currentLayer = activeLayer === "a" ? layerA : layerB;
      const nextImage = activeLayer === "a" ? imageB : imageA;

      try {
        await preloadScene(index);
        if (token !== transitionToken) return;

        setImageSource(nextImage, index);
        if (nextImage.decode) {
          // Do not block the crossfade on decode: some browsers leave it pending
          // for images that are already cached or not yet painted.
          nextImage.decode().catch(() => {});
        }
        if (token !== transitionToken) return;

        nextLayer.classList.add("is-active");
        currentLayer.classList.remove("is-active");
        activeLayer = activeLayer === "a" ? "b" : "a";
        current = index;
        updateInterface();
      } catch (error) {
        // Keep the last working scene if a source fails.
        console.warn(error.message);
      }
    };

    const clearTimer = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      if (paused || !inView || document.hidden) return;

      timer = window.setTimeout(() => {
        showScene((current + 1) % scenes.length).finally(scheduleNext);
      }, 3800);
    };

    const setPaused = (value) => {
      paused = value;
      updateInterface();
      if (paused) {
        clearTimer();
      } else {
        scheduleNext();
      }
    };

    if (toggle) {
      if (reducedMotion.matches) {
        toggle.hidden = true;
      }

      toggle.addEventListener("click", () => {
        setPaused(!paused);
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.scene);
        if (Number.isNaN(index)) return;
        setPaused(true);
        showScene(index);
      });
    });

    // First scene is visible immediately; the sequence starts after paint.
    updateInterface();
    window.requestAnimationFrame(() => {
      layerA.classList.add("is-active");
      scheduleNext();
    });

    // Preload the remaining scenes after the page has settled.
    const preloadAll = () => {
      scenes.forEach((_, index) => {
        preloadScene(index).catch(() => {});
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(preloadAll, { timeout: 3500 });
    } else {
      window.setTimeout(preloadAll, 2200);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimer();
      } else {
        scheduleNext();
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) {
            scheduleNext();
          } else {
            clearTimer();
          }
        });
      }, { threshold: 0.15 });

      observer.observe(hero);
    }

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", (event) => {
        if (event.matches) {
          setPaused(true);
          if (toggle) toggle.hidden = true;
        } else {
          if (toggle) toggle.hidden = false;
          setPaused(false);
        }
      });
    }
  };

  /* ---------------------------------------------
     SCROLL REVEAL
  --------------------------------------------- */

  const initReveal = () => {
    const elements = $$("[data-reveal]");
    if (!elements.length) return;

    // Stagger items inside declared groups.
    $$("[data-reveal-group]").forEach((group) => {
      $$("[data-reveal]", group).forEach((element, index) => {
        element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);
      });
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px"
    });

    elements.forEach((element) => observer.observe(element));

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", (event) => {
        if (event.matches) {
          elements.forEach((element) => element.classList.add("is-visible"));
        }
      });
    }
  };

  /* ---------------------------------------------
     SMOOTH ANCHOR NAVIGATION
  --------------------------------------------- */

  const initAnchors = () => {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") {
          event.preventDefault();
          return;
        }

        const target = document.getElementById(href.slice(1));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start"
        });

        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: true });
      });
    });
  };

  /* ---------------------------------------------
     PORTFOLIO FILTER + PROJECT DIALOG
  --------------------------------------------- */

  const initPortfolio = () => {
    const filters = $$("[data-filter]");
    const cards = $$("[data-category]");
    const count = $("[data-portfolio-count]");
    const empty = $("[data-portfolio-empty]");
    if (!filters.length || !cards.length) return;

    const applyFilter = (category) => {
      let visible = 0;

      cards.forEach((card) => {
        const matches = category === "all" || card.dataset.category === category;
        card.hidden = !matches;
        if (matches) visible += 1;
      });

      if (count) {
        count.textContent = `${String(visible).padStart(2, "0")} project${visible === 1 ? "" : "s"}`;
      }

      if (empty) {
        empty.hidden = visible !== 0;
      }
    };

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.filter || "all";

        filters.forEach((filter) => {
          const active = filter === button;
          filter.classList.toggle("is-active", active);
          filter.setAttribute("aria-pressed", String(active));
        });

        applyFilter(category);
      });
    });

    const initial = filters.find((button) => button.classList.contains("is-active"));
    applyFilter(initial ? initial.dataset.filter : "all");

    /* Project dialog */

    const dialog = $("#projectDialog");
    if (!dialog) return;

    let lastTrigger = null;

    const dialogImage = $("#projectDialogImage", dialog);
    const dialogPicture = dialogImage ? dialogImage.closest("picture") : null;
    const dialogCategory = $("#projectDialogCategory", dialog);
    const dialogTitle = $("#projectDialogTitle", dialog);
    const dialogDescription = $("#projectDialogDescription", dialog);
    const dialogCta = $("#projectDialogCta", dialog);

    const openProject = (card, trigger) => {
      const title = card.dataset.title || "";
      const category = card.dataset.categoryLabel || card.dataset.category || "";
      const description = card.dataset.description || "";
      const image = card.dataset.image || "";
      const imageWebp = card.dataset.imageWebp || "";

      if (dialogTitle) dialogTitle.textContent = title;
      if (dialogCategory) dialogCategory.textContent = category;
      if (dialogDescription) dialogDescription.textContent = description;

      if (dialogImage && image) {
        const source = dialogPicture ? $("source", dialogPicture) : null;
        if (source && imageWebp) source.srcset = imageWebp;
        dialogImage.src = image;
        dialogImage.alt = title;
      }

      if (dialogCta) {
        const message = encodeURIComponent(
          `Hello PIXRAW, I'd like to know more about your ${category.toLowerCase()} work.`
        );
        dialogCta.href = `https://wa.me/917592932057?text=${message}`;
      }

      lastTrigger = trigger;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
        document.body.classList.add("is-locked");
        const close = $(".project-dialog__close", dialog);
        if (close) close.focus({ preventScroll: true });
      }
    };

    const unlockPage = () => {
      document.body.classList.remove("is-locked");
    };

    const returnDialogFocus = () => {
      if (lastTrigger instanceof HTMLElement) {
        lastTrigger.focus({ preventScroll: true });
      }
    };

    const closeProject = () => {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      }
      // Some engines do not dispatch a close event for scripted closes, so
      // release the scroll lock and restore focus here as well.
      unlockPage();
      returnDialogFocus();
    };

    $$("[data-project-open]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const card = trigger.closest(".portfolio-card");
        if (card) openProject(card, trigger);
      });
    });

    $$("[data-dialog-close]", dialog).forEach((button) => {
      button.addEventListener("click", closeProject);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeProject();
    });

    dialog.addEventListener("close", () => {
      unlockPage();
      returnDialogFocus();
    });

    // Native Escape dismissal should release the page even if the close
    // event is not delivered.
    dialog.addEventListener("cancel", unlockPage);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dialog.open) {
        event.preventDefault();
        closeProject();
      }
    });
  };

  /* ---------------------------------------------
     EXTERNAL LINK HARDENING
  --------------------------------------------- */

  const hardenExternalLinks = () => {
    $$('a[target="_blank"]').forEach((link) => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", Array.from(rel).join(" "));
    });
  };

  /* ---------------------------------------------
     PREMIUM ENHANCEMENTS
     Scroll progress · Back to top · Card tilt · Hero parallax
  --------------------------------------------- */

  const initPremiumEnhancements = () => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const canAnimate = !reducedMotion.matches;

    // Scroll progress bar + back-to-top button.
    // Add animated silver glow line to every button.
    $$(".btn").forEach((button) => {
      if (button.querySelector(".btn__glow-line")) return;
      const line = document.createElement("span");
      line.className = "btn__glow-line";
      line.setAttribute("aria-hidden", "true");
      button.prepend(line);
    });

    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.appendChild(progressBar);

    const backToTop = document.createElement("button");
    backToTop.type = "button";
    backToTop.className = "back-to-top";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.innerHTML = "↑";
    document.body.appendChild(backToTop);

    // Page transition overlay (gradient).
    const pageTransition = document.createElement("div");
    pageTransition.className = "page-transition";
    pageTransition.setAttribute("aria-hidden", "true");
    document.body.appendChild(pageTransition);

    if (!reducedMotion.matches) {
      pageTransition.classList.add("is-active");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => pageTransition.classList.remove("is-active"));
      });
    }

    const isInternalPageLink = (link) => {
      if (!link || !link.href) return false;
      if (link.target === "_blank" || link.hasAttribute("download")) return false;
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return false;
      }
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.hash) return false;
      return /\\.html?$/.test(url.pathname) || url.pathname === "/" || url.pathname.endsWith("/");
    };

    document.addEventListener("click", (event) => {
      if (reducedMotion.matches) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest("a[href]");
      if (!link || !isInternalPageLink(link)) return;

      event.preventDefault();
      if (pageTransition.classList.contains("is-active")) return;
      pageTransition.classList.add("is-active");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 260);
    });

    let ticking = false;
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      const progress = Math.min(1, Math.max(0, scrollTop / max));
      progressBar.style.transform = `scaleX(${progress})`;
      backToTop.classList.toggle("is-visible", scrollTop > 640);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateProgress();

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });

    // Hero parallax (desktop, motion allowed).
    if (canAnimate && finePointer) {
      const hero = $(".hero");
      if (hero) {
        const media = $("[data-hero-media]", hero);
        const copy = $(".hero__copy", hero);
        const foot = $(".hero__foot", hero);
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let raf = 0;

        const render = () => {
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;
          if (media) media.style.transform = `translate3d(${currentX * 12}px, ${currentY * 10}px, 0) scale(1.02)`;
          if (copy) copy.style.transform = `translate3d(${currentX * -8}px, ${currentY * -6}px, 0)`;
          if (foot) foot.style.transform = `translate3d(${currentX * -4}px, ${currentY * -3}px, 0)`;
          raf = window.requestAnimationFrame(render);
        };

        hero.addEventListener("mousemove", (event) => {
          const rect = hero.getBoundingClientRect();
          targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        });

        hero.addEventListener("mouseleave", () => {
          targetX = 0;
          targetY = 0;
        });

        raf = window.requestAnimationFrame(render);

        window.addEventListener("pagehide", () => window.cancelAnimationFrame(raf), { once: true });
      }
    }

    // Subtle 3D tilt for premium cards (desktop, motion allowed).
    if (canAnimate && finePointer) {
      const tiltSelectors = [
        ".division-card",
        ".work-card",
        ".capability",
        ".package-card",
        ".contact-card",
        ".why-item",
        ".process-step"
      ];
      const cards = $$(tiltSelectors.join(", "));

      cards.forEach((card) => {
        let frame = 0;
        let rx = 0;
        let ry = 0;
        let tx = 0;
        let ty = 0;

        const update = () => {
          rx += (tx - rx) * 0.12;
          ry += (ty - ry) * 0.12;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
          if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) {
            frame = window.requestAnimationFrame(update);
          } else {
            frame = 0;
          }
        };

        card.addEventListener("mousemove", (event) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          tx = py * -6;
          ty = px * 8;
          if (!frame) frame = window.requestAnimationFrame(update);
        });

        const reset = () => {
          tx = 0;
          ty = 0;
          if (!frame) frame = window.requestAnimationFrame(update);
        };

        card.addEventListener("mouseleave", reset);
        card.addEventListener("blur", reset, true);
      });
    }
  };

  /* ---------------------------------------------
     BOOT
  --------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    setCurrentYear();
    initHeader();
    initMobileNavigation();
    initHero();
    initReveal();
    initAnchors();
    initPortfolio();
    hardenExternalLinks();
    initPremiumEnhancements();
  });
})();
