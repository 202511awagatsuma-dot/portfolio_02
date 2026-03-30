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
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });
  }

  const featureCarousel = document.querySelector("[data-feature-carousel]");
  const featureTrack = featureCarousel?.querySelector("[data-feature-track]");
  const featureViewport = featureCarousel?.querySelector(".feature-carousel-viewport");

  if (featureCarousel && featureTrack && featureViewport) {
    const desktopMedia = window.matchMedia("(min-width: 1201px)");
    let maxTranslate = 0;
    let sectionTop = 0;
    let ticking = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateProgress = () => {
      if (!desktopMedia.matches) return;
      const progressed = clamp(window.scrollY - sectionTop, 0, maxTranslate);
      featureTrack.style.transform = `translate3d(${-progressed}px, 0, 0)`;
    };

    const recalc = () => {
      if (!desktopMedia.matches) {
        featureCarousel.style.setProperty("--feature-scroll-distance", "0px");
        featureTrack.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      maxTranslate = Math.max(featureTrack.scrollWidth - featureViewport.clientWidth, 0);
      sectionTop = featureCarousel.getBoundingClientRect().top + window.scrollY;
      featureCarousel.style.setProperty("--feature-scroll-distance", `${maxTranslate}px`);
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
