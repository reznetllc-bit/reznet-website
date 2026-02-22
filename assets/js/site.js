// RezNet site JS: small, fast, no deps
(() => {
  document.documentElement.classList.add("js");

  // Year stamp
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  // Reveal on scroll (uses ".in" because CSS expects that)
  const els = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  // Report preview swapper (Assessment page)
  const img = document.getElementById("previewImg");
  if (img) {
    const map = {
      wifi: "/assets/img/panel-wifi.png",
      unifi: "/assets/img/panel-unifi.png",
      cameras: "/assets/img/panel-cameras.png",
    };

    const setActive = (key) => {
      if (!map[key]) return;
      img.classList.add("swap");
      img.src = map[key];

      document.querySelectorAll("[data-preview]").forEach((c) => {
        c.classList.toggle("active", c.getAttribute("data-preview") === key);
      });

      setTimeout(() => img.classList.remove("swap"), 180);
    };

    document.querySelectorAll("[data-preview-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setActive(btn.getAttribute("data-preview-btn")));
    });

    setActive("wifi");
  }
})();
