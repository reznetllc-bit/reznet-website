// RezNet site JS (safe defaults)
(() => {
  // Mark JS-enabled (used by CSS reveal system)
  document.documentElement.classList.add("js");

  // Year stamp
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // Reveal on scroll (opt-in)
  const els = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("reveal");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
})();
