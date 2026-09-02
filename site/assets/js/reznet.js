(() => {
  "use strict";

  const header = document.getElementById("site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const navLinks = navigation ? [...navigation.querySelectorAll("a[href^='#']")] : [];
  const form = document.getElementById("assessment-request");
  const formStatus = document.getElementById("form-status");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  const closeMenu = () => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    });

    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!navigation.classList.contains("is-open")) return;
      if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealElements = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px" });

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const observedSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href").slice(1);
      return { link, section: document.getElementById(id) };
    })
    .filter((item) => item.section);

  if ("IntersectionObserver" in window && observedSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      const current = observedSections.find((item) => item.section === visible.target);
      if (current) current.link.setAttribute("aria-current", "true");
    }, { rootMargin: "-38% 0px -55%", threshold: [0.01, 0.2, 0.5] });

    observedSections.forEach((item) => navObserver.observe(item.section));
  }

  const setFormStatus = (message, type = "info") => {
    if (!formStatus) return;
    formStatus.className = `form-status is-visible${type === "success" ? " is-success" : ""}`;
    formStatus.innerHTML = message;
  };

  const clearFieldError = (field) => {
    field.removeAttribute("aria-invalid");
  };

  const validateForm = () => {
    if (!form) return false;
    const required = [...form.querySelectorAll("[required]")];
    let firstInvalid = null;

    required.forEach((field) => {
      clearFieldError(field);
      if (!field.checkValidity()) {
        field.setAttribute("aria-invalid", "true");
        if (!firstInvalid) firstInvalid = field;
      }
    });

    const email = form.elements.email;
    if (email && email.value && !email.checkValidity()) {
      email.setAttribute("aria-invalid", "true");
      firstInvalid ||= email;
    }

    if (firstInvalid) {
      setFormStatus("Please complete the marked required fields so RezNet can review the request.");
      firstInvalid.focus();
      return false;
    }
    return true;
  };

  const getStoredToken = () => {
    try {
      const raw = localStorage.getItem("reznet_wix_visitor");
      if (!raw) return null;
      const token = JSON.parse(raw);
      if (!token.accessToken || !token.expiresAt || token.expiresAt < Date.now() + 60_000) return null;
      return token;
    } catch {
      return null;
    }
  };

  const getWixVisitorToken = async (clientId) => {
    const existing = getStoredToken();
    if (existing) return existing.accessToken;

    const response = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, grantType: "anonymous" })
    });

    if (!response.ok) throw new Error(`Visitor authentication failed (${response.status})`);
    const data = await response.json();
    if (!data.access_token) throw new Error("Visitor authentication returned no access token");

    try {
      localStorage.setItem("reznet_wix_visitor", JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || "",
        expiresAt: Date.now() + Math.max(300, Number(data.expires_in || 14400) - 120) * 1000
      }));
    } catch {
      // Storage can be blocked by privacy settings; the current request still works.
    }

    return data.access_token;
  };

  const createMessage = (data) => [
    "REZNET PRE-LAUNCH ASSESSMENT REQUEST",
    "",
    `Property city / ZIP: ${data.get("city_zip") || "Not provided"}`,
    `Role: ${data.get("role") || "Not provided"}`,
    `Property stage: ${data.get("property_stage") || "Not provided"}`,
    `Primary concern: ${data.get("primary_concern") || "Not provided"}`,
    `Approx. square footage: ${data.get("square_footage") || "Not provided"}`,
    `Timeline: ${data.get("timeline") || "Not provided"}`,
    "",
    "Notes:",
    data.get("notes") || "No additional notes.",
    "",
    `Contact permission: ${data.get("contact_permission") ? "Yes" : "No"}`,
    `Source page: ${window.location.href}`
  ].join("\n");

  const splitName = (fullName) => {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts.shift() || "",
      lastName: parts.join(" ")
    };
  };

  const submitToWix = async (data, config) => {
    const token = await getWixVisitorToken(config.clientId);
    const { firstName, lastName } = splitName(data.get("name"));
    const targets = config.submissionTargets;

    const response = await fetch("https://www.wixapis.com/form-submission-service/v4/submissions", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submission: {
          formId: config.formId,
          submissions: {
            [targets.firstName]: firstName,
            [targets.lastName]: lastName,
            [targets.email]: data.get("email"),
            [targets.phone]: data.get("phone"),
            [targets.message]: createMessage(data)
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wix submission failed (${response.status}): ${error.slice(0, 180)}`);
    }
    return response.json();
  };

  const emailFallback = (data) => {
    const subject = encodeURIComponent("RezNet priority assessment request");
    const body = encodeURIComponent([
      `Name: ${data.get("name") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Phone: ${data.get("phone") || ""}`,
      "",
      createMessage(data)
    ].join("\n"));
    return `mailto:hello@reznetllc.com?subject=${subject}&body=${body}`;
  };

  if (form) {
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => clearFieldError(field));
      field.addEventListener("change", () => clearFieldError(field));
    });

    form.addEventListener("submit", async (event) => {
      if (!validateForm()) {
        event.preventDefault();
        return;
      }

      const config = window.REZNET_WIX || {};
      const wixReady = Boolean(config.enabled && config.clientId && config.formId);

      // On a Netlify deploy before Wix is wired, use Netlify Forms natively.
      if (!wixReady && /(^|\.)netlify\.app$/i.test(window.location.hostname)) return;

      event.preventDefault();
      const data = new FormData(form);
      const submitButton = form.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = true;
      setFormStatus("Sending your request securely…");

      if (!wixReady) {
        const fallback = emailFallback(data);
        setFormStatus(`This preview is not connected to the intake backend yet. <a href="${fallback}">Open your email with the request pre-filled</a>, or call <a href="tel:+13363478466">336-347-8466</a>.`);
        if (submitButton) submitButton.disabled = false;
        return;
      }

      try {
        await submitToWix(data, config);
        form.reset();
        setFormStatus("Thank you. RezNet received your request and will follow up with the right starting point. A pre-launch request is not a confirmed appointment.", "success");
      } catch (error) {
        console.error(error);
        const fallback = emailFallback(data);
        setFormStatus(`The secure form could not finish sending. <a href="${fallback}">Send the request by email instead</a>, or call <a href="tel:+13363478466">336-347-8466</a>.`);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
