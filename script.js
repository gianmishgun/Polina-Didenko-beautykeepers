let currentLang = "en";

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.getAttribute("data-i18n");
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });

  document.documentElement.lang = lang;
}

document.addEventListener("DOMContentLoaded", () => {
  // Detect browser language if available
  const navLang = navigator.language ? navigator.language.slice(0, 2) : "en";
  if (["en", "fi", "ru"].includes(navLang)) {
    setLanguage(navLang);
  } else {
    setLanguage("en");
  }

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      setLanguage(lang);
    });
  });
});
