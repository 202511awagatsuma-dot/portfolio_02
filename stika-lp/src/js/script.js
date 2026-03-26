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
});
