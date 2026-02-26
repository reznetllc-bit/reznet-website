// RezNet site JS: small, fast, no deps
(() => {
  // Mark JS presence for safe reveal animations
  document.documentElement.classList.add("js");

  // Year stamp
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Reveal on scroll (CSS expects ".in")
  const els = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  // Premium Sample Preview swapper (Assessment page)
  const img = document.getElementById("previewImg");
  if (img) {
    const meta = {
      wifi: {
        img: "/assets/img/panel-wifi.png",
        score: "6.8",
        wins: "2",
        upg: "3",
        inst: "Optional",
        sev: "HIGH",
        title: "Living Room — stability drop during peak usage",
        body: "Signal dips below target threshold behind the fireplace wall. Root cause is attenuation + AP placement, not ISP speed.",
        cause: "Wall attenuation + poor AP centerline",
        fix: "Add ceiling AP at hallway centerline",
        prio: "High (user-facing)",
      },
      unifi: {
        img: "/assets/img/panel-unifi.png",
        score: "7.4",
        wins: "1",
        upg: "2",
        inst: "Optional",
        sev: "MED",
        title: "Network Closet — wiring present but not usable yet",
        body: "Cables are in place but not terminated/labeled. Without cleanup, upgrades turn into guesswork and support headaches.",
        cause: "Unterminated runs + no labeling",
        fix: "Terminate + label; validate runs; stage backhaul",
        prio: "Medium (foundation work)",
      },
      cameras: {
        img: "/assets/img/panel-cameras.png",
        score: "6.2",
        wins: "2",
        upg: "3",
        inst: "By request",
        sev: "HIGH",
        title: "Cameras — dropped feeds during uplink contention",
        body: "Video streams stutter when uplink is unstable. Stability fixes beat raw download speed every time.",
        cause: "Weak uplink stability + placement",
        fix: "Stabilize uplink path; segment IoT; optimize placement",
        prio: "High (security reliability)",
      },
    };

    const scoreVal = document.getElementById("scoreVal");
    const winsVal = document.getElementById("winsVal");
    const upgVal = document.getElementById("upgVal");
    const instVal = document.getElementById("instVal");
    const sevVal = document.getElementById("sevVal");
    const findingTitle = document.getElementById("findingTitle");
    const findingBody = document.getElementById("findingBody");
    const causeVal = document.getElementById("causeVal");
    const fixVal = document.getElementById("fixVal");
    const prioVal = document.getElementById("prioVal");

    const setActive = (key) => {
      const m = meta[key];
      if (!m) return;

      // tab active
      document.querySelectorAll("[data-preview-btn]").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-preview-btn") === key);
      });

      // image swap
      img.classList.add("swap");
      img.src = m.img;
      setTimeout(() => img.classList.remove("swap"), 180);

      // meta swap
      if (scoreVal) scoreVal.innerHTML = `${m.score}<span class="score-x">/10</span>`;
      if (winsVal) winsVal.textContent = m.wins;
      if (upgVal) upgVal.textContent = m.upg;
      if (instVal) instVal.textContent = m.inst;

      if (sevVal) sevVal.textContent = m.sev;
      if (findingTitle) findingTitle.textContent = m.title;
      if (findingBody) findingBody.textContent = m.body;
      if (causeVal) causeVal.textContent = m.cause;
      if (fixVal) fixVal.textContent = m.fix;
      if (prioVal) prioVal.textContent = m.prio;
    };

    document.querySelectorAll("[data-preview-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setActive(btn.getAttribute("data-preview-btn")));
    });

    setActive("wifi");
  }
})();
