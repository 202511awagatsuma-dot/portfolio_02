document.addEventListener("DOMContentLoaded", () => {
  const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Hero intro animation: play once per browser session on the LP top page.
  const heroIntroSection = document.querySelector("[data-hero-intro]");
  if (heroIntroSection) {
    const introPlayedKey = "stikaHeroIntroPlayed";
    const introAlreadyPlayed = sessionStorage.getItem(introPlayedKey) === "1";

    if (reduceMotionMedia.matches || introAlreadyPlayed) {
      document.body.classList.add("is-hero-loaded");
      sessionStorage.setItem(introPlayedKey, "1");
    } else {
      document.body.classList.add("hero-intro-animating");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.body.classList.add("is-hero-loaded");
          sessionStorage.setItem(introPlayedKey, "1");
        });
      });
    }
  }

  const menuToggle = document.querySelector(".header-menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const mobileLayoutMedia = window.matchMedia("(max-width: 840px)");

  if (menuToggle && mobileMenu && mobileMenuOverlay) {
    const setMobileMenuState = (shouldOpen) => {
      document.body.classList.toggle("is-mobile-menu-open", shouldOpen);
      menuToggle.setAttribute("aria-expanded", String(shouldOpen));
      menuToggle.setAttribute("aria-label", shouldOpen ? "メニューを閉じる" : "メニューを開く");
      mobileMenu.hidden = !shouldOpen;
      mobileMenuOverlay.hidden = !shouldOpen;
    };

    const closeMobileMenu = () => setMobileMenuState(false);

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMobileMenuState(!isOpen);
    });

    mobileMenuOverlay.addEventListener("click", closeMobileMenu);

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMobileMenu();
    });

    const syncMobileMenuToViewport = () => {
      if (mobileLayoutMedia.matches) return;
      closeMobileMenu();
    };

    if (typeof mobileLayoutMedia.addEventListener === "function") {
      mobileLayoutMedia.addEventListener("change", syncMobileMenuToViewport);
    } else {
      mobileLayoutMedia.addListener(syncMobileMenuToViewport);
    }

    closeMobileMenu();
  }

  const faqButtons = document.querySelectorAll(".faq-question");
  const setupFaqIcon = (button) => {
    if (button.querySelector(".faq-toggle-icon")) return;
    const icon = document.createElement("span");
    icon.className = "faq-toggle-icon";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
  };

  const setFaqState = (button, shouldOpen, immediate = false) => {
    const answer = button.nextElementSibling;
    if (!answer) return;
    if (immediate) {
      answer.classList.add("faq-no-motion");
    } else {
      answer.classList.remove("faq-no-motion");
    }

    button.setAttribute("aria-expanded", String(shouldOpen));
    button.classList.toggle("is-open", shouldOpen);
    answer.classList.toggle("open", shouldOpen);

    if (shouldOpen) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
      answer.style.opacity = "1";
      return;
    }

    answer.style.maxHeight = "0px";
    answer.style.opacity = "0";
  };

  faqButtons.forEach((button) => {
    setupFaqIcon(button);
    const initialOpen = button.getAttribute("aria-expanded") === "true";
    setFaqState(button, initialOpen, true);

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      setFaqState(button, !isOpen, reduceMotionMedia.matches);
    });
  });

  window.addEventListener("resize", () => {
    faqButtons.forEach((button) => {
      if (button.getAttribute("aria-expanded") !== "true") return;
      setFaqState(button, true, true);
    });
  });

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = "signup-complete.html";
    });
  }

  const planRadios = document.querySelectorAll(".plan-toggle input[type='radio']");
  if (planRadios.length > 0) {
    const syncPlanSelection = () => {
      planRadios.forEach((radio) => {
        const label = radio.closest(".toggle-item");
        if (!label) return;
        label.classList.toggle("selected", radio.checked);
      });
    };

    planRadios.forEach((radio) => {
      radio.addEventListener("change", syncPlanSelection);
    });

    syncPlanSelection();
  }

  // Scroll reveal: one-time animation trigger for each section element.
  const registerReveal = (element, variant, delaySeconds = 0) => {
    if (!element) return;
    element.classList.add("reveal", variant);
    if (delaySeconds > 0) {
      element.style.setProperty("--reveal-delay", `${delaySeconds}s`);
    }
  };

  const registerRevealTargets = () => {
    const aboutHeading = document.querySelector("#about .section-heading h2");
    registerReveal(aboutHeading, "reveal-up");
    document.querySelectorAll("#about .about-copy p").forEach((item, index) => {
      registerReveal(item, "reveal-up", 0.08 + index * 0.06);
    });

    const aboutDottedLine = document.querySelector("#about .about-dotted-line");
    const aboutCircleTop = document.querySelector("#about .about-circle.top");
    const aboutCircleLeft = document.querySelector("#about .about-circle.left");
    const aboutCircleRight = document.querySelector("#about .about-circle.right");
    const aboutLogo = document.querySelector("#about .about-center-logo");
    [aboutDottedLine, aboutCircleTop, aboutCircleLeft, aboutCircleRight, aboutLogo].forEach((item) => {
      if (!item) return;
      item.classList.add("about-seq-item");
    });
    if (aboutDottedLine) aboutDottedLine.style.setProperty("--reveal-delay", "0.12s");
    if (aboutCircleTop) aboutCircleTop.style.setProperty("--reveal-delay", "0.24s");
    if (aboutCircleLeft) aboutCircleLeft.style.setProperty("--reveal-delay", "0.34s");
    if (aboutCircleRight) aboutCircleRight.style.setProperty("--reveal-delay", "0.44s");
    if (aboutLogo) aboutLogo.style.setProperty("--reveal-delay", "0.58s");

    const valueHeading = document.querySelector(".value-section .section-heading");
    registerReveal(valueHeading, "reveal-up");
    document.querySelectorAll(".value-card").forEach((card, index) => {
      registerReveal(card, "reveal-up", 0.14 + index * 0.1);
    });

    const timelineHeading = document.querySelector(".timeline-wrap")?.previousElementSibling;
    registerReveal(timelineHeading, "reveal-up");
    const timelineLine = document.querySelector(".timeline-line");
    if (timelineLine) {
      timelineLine.classList.add("timeline-line-reveal");
      timelineLine.style.setProperty("--reveal-delay", "0.12s");
    }
    document.querySelectorAll(".timeline-line img").forEach((icon, index) => {
      registerReveal(icon, "reveal-scale", 0.26 + index * 0.1);
    });
    document.querySelectorAll(".timeline-item").forEach((item, index) => {
      registerReveal(item, "reveal-up", 0.3 + index * 0.12);
    });
    const timelineSummary = document.querySelector(".timeline-summary");
    registerReveal(timelineSummary, "reveal-up", 0.66);

    const problemHeading = document.querySelector(".problem-copy h2");
    const problemText = document.querySelector(".problem-copy h2 + p");
    const problemVisual = document.querySelector(".problem-visual");
    registerReveal(problemHeading, "reveal-up");
    registerReveal(problemText, "reveal-up", 0.08);
    document.querySelectorAll(".problem-copy li").forEach((item, index) => {
      registerReveal(item, "reveal-scale", 0.16 + index * 0.12);
    });
    registerReveal(problemVisual, "reveal-up", 0.52);

    const comparisonHeading = document.querySelector(".comparison-table")?.previousElementSibling;
    registerReveal(comparisonHeading, "reveal-up");
    const comparisonHead = document.querySelector(".comparison-table .row.head");
    registerReveal(comparisonHead, "reveal-up", 0.08);
    document.querySelectorAll(".comparison-table .row:not(.head)").forEach((row, index) => {
      registerReveal(row, "reveal-up", 0.14 + index * 0.08);
    });
    registerReveal(document.querySelector(".comparison-copy"), "reveal-up", 0.56);

    registerReveal(document.querySelector("#apply .section-heading"), "reveal-up");
    registerReveal(document.querySelector("#apply .apply-form"), "reveal-up", 0.12);
    document.querySelectorAll("#apply .plan-toggle .toggle-item").forEach((item, index) => {
      registerReveal(item, "reveal-scale", 0.22 + index * 0.1);
    });
  };

  const initRevealObserver = () => {
    registerRevealTargets();

    const revealTargets = document.querySelectorAll(".reveal, .about-seq-item, .timeline-line-reveal");
    if (revealTargets.length === 0) return;

    if (reduceMotionMedia.matches || typeof IntersectionObserver === "undefined") {
      revealTargets.forEach((element) => element.classList.add("is-inview"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.2,
      }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  };

  initRevealObserver();

  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const passwordInput = togglePassword
        .closest(".password-wrap")
        .querySelector("input[type='password'], input[type='text']");
      if (!passwordInput) return;
      const willShow = passwordInput.type === "password";
      passwordInput.type = willShow ? "text" : "password";
      togglePassword.classList.toggle("is-visible", willShow);
      togglePassword.setAttribute("aria-pressed", String(willShow));
      togglePassword.setAttribute(
        "aria-label",
        willShow ? "Hide password" : "Show password"
      );
    });
  }

  const featureCarousel = document.querySelector("[data-feature-carousel]");
  const featureTrack = featureCarousel?.querySelector("[data-feature-track]");
  const featureViewport = featureCarousel?.querySelector(".feature-carousel-viewport");

  if (featureCarousel && featureTrack && featureViewport) {
    const desktopMedia = window.matchMedia("(min-width: 1201px)");
    const scrollCompression = 0.22;
    const bottomGap = 100;
    let maxTranslate = 0;
    let verticalDistance = 0;
    let sectionTop = 0;
    let sectionEnd = 0;
    let ticking = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateProgress = () => {
      if (!desktopMedia.matches) return;
      const scrolled = window.scrollY - sectionTop;
      const progressed = clamp(scrolled / scrollCompression, 0, maxTranslate);
      featureTrack.style.transform = `translate3d(${-progressed}px, 0, 0)`;
      featureCarousel.classList.toggle("is-pinned", window.scrollY >= sectionTop && window.scrollY <= sectionEnd);
      featureCarousel.classList.toggle("is-after", window.scrollY > sectionEnd);
    };

    const recalc = () => {
      if (!desktopMedia.matches) {
        featureCarousel.style.setProperty("--feature-scroll-distance", "0px");
        featureCarousel.style.setProperty("--feature-release-top", "0px");
        featureCarousel.style.setProperty("--feature-carousel-height", "auto");
        featureTrack.style.transform = "translate3d(0, 0, 0)";
        featureCarousel.classList.remove("is-pinned", "is-after");
        return;
      }

      const boxHeight = featureViewport.clientHeight;
      const pinTop = (window.innerHeight - boxHeight) / 2;
      maxTranslate = Math.max(featureTrack.scrollWidth - featureViewport.clientWidth, 0);
      verticalDistance = maxTranslate * scrollCompression;
      const releaseTop = verticalDistance + pinTop;
      const carouselHeight = releaseTop + boxHeight + bottomGap;
      sectionTop = featureCarousel.getBoundingClientRect().top + window.scrollY;
      sectionEnd = sectionTop + verticalDistance;
      featureCarousel.style.setProperty("--feature-scroll-distance", `${verticalDistance}px`);
      featureCarousel.style.setProperty("--feature-release-top", `${releaseTop}px`);
      featureCarousel.style.setProperty("--feature-carousel-height", `${carouselHeight}px`);
      updateProgress();
    };

    const requestProgressUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
    };

    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", recalc);
    desktopMedia.addEventListener("change", recalc);
    recalc();
  }
});

