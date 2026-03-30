document.addEventListener("DOMContentLoaded", () => {
  const faqButtons = document.querySelectorAll(".faq-question");
  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      answer.classList.toggle("open", !isOpen);
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

