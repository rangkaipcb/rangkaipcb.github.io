/* =========================================================
   RangkaiPCB, Jasa Desain PCB
   Shared vanilla JS: theme toggle, language toggle, mobile nav.
   No dependencies, no build step.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "rs-theme";
  var LANG_KEY = "rs-lang";

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var effective = theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      btn.setAttribute("aria-pressed", effective === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", effective === "dark" ? "Ganti ke mode terang / Switch to light mode" : "Ganti ke mode gelap / Switch to dark mode");
    }
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    applyTheme(stored);

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = root.getAttribute("data-theme");
        if (!current) {
          current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      });
    }
  }

  /* ---------- Language ---------- */
  function applyLang(lang) {
    var code = lang === "en" ? "en" : "id";
    root.setAttribute("lang", code);
    root.setAttribute("data-lang", code);

    var attr = code === "en" ? "data-lang-en" : "data-lang-id";
    var nodes = document.querySelectorAll("[data-lang-id][data-lang-en]");
    nodes.forEach(function (el) {
      var val = el.getAttribute(attr);
      if (val !== null) el.innerHTML = val;
    });

    var placeholderAttr = code === "en" ? "data-lang-placeholder-en" : "data-lang-placeholder-id";
    var placeholderNodes = document.querySelectorAll("[data-lang-placeholder-id][data-lang-placeholder-en]");
    placeholderNodes.forEach(function (el) {
      var val = el.getAttribute(placeholderAttr);
      if (val !== null) el.setAttribute("placeholder", val);
    });

    var buttons = document.querySelectorAll(".lang-toggle button");
    buttons.forEach(function (b) {
      var isActive = b.getAttribute("data-lang-btn") === code;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    document.title = getTitleForLang(code);
    updateMetaDescription(code);
  }

  function getTitleForLang(lang) {
    var titleEl = document.querySelector("title");
    if (!titleEl) return document.title;
    var attr = lang === "en" ? "data-title-en" : "data-title-id";
    var val = titleEl.getAttribute(attr);
    return val || document.title;
  }

  function updateMetaDescription(lang) {
    var meta = document.querySelector('meta[name="description"]');
    if (!meta) return;
    var attr = lang === "en" ? "data-desc-en" : "data-desc-id";
    var val = meta.getAttribute(attr);
    if (val) meta.setAttribute("content", val);
  }

  function initLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    var lang = stored === "en" ? "en" : "id";
    applyLang(lang);

    var buttons = document.querySelectorAll(".lang-toggle button");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var chosen = b.getAttribute("data-lang-btn") === "en" ? "en" : "id";
        applyLang(chosen);
        try { localStorage.setItem(LANG_KEY, chosen); } catch (e) { /* ignore */ }
      });
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = document.getElementById("current-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var items = document.querySelectorAll(".faq-item");
    items.forEach(function (item) {
      var btn = item.querySelector(".faq-question");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var isOpen = item.getAttribute("data-open") === "true";
        item.setAttribute("data-open", isOpen ? "false" : "true");
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });
    });
  }

  /* =========================================================
     Spec selector (Selektor Spesifikasi)
     Bilingual labels + typical component lists, no prices for
     components; only the design service fee (Rp 100k / 150k / 200k).
     ========================================================= */

  var SPEC_LABELS = {
    project: {
      motor: { id: "Motor Controller DC/BLDC", en: "DC/BLDC Motor Controller" },
      iot: { id: "IoT / ESP32-Arduino", en: "IoT / ESP32-Arduino" },
      power: { id: "Power Supply", en: "Power Supply" },
      sensor: { id: "Sensor / Data Acquisition", en: "Sensor / Data Acquisition" },
      lainnya: { id: "Lainnya", en: "Other" }
    },
    mcu: {
      esp32: { id: "ESP32", en: "ESP32" },
      arduino: { id: "Arduino", en: "Arduino" },
      stm32: { id: "STM32", en: "STM32" },
      "belum-tahu-mcu": { id: "Belum tahu, dibantu", en: "Not sure yet, help me decide" },
      tidak: { id: "Tidak", en: "No" }
    },
    layer: {
      single: { id: "Single Layer", en: "Single Layer" },
      double: { id: "Double Layer", en: "Double Layer" },
      multilayer: { id: "Multilayer 4 Layer+", en: "Multilayer 4 Layer+" },
      "belum-tahu-layer": { id: "Belum tahu, dibantu tentukan", en: "Not sure yet, help me decide" }
    }
  };

  var PARTS_CATEGORY_LABELS = {
    "Gate Driver": { id: "Gate Driver", en: "Gate Driver" },
    "MOSFET / Transistor": { id: "MOSFET / Transistor", en: "MOSFET / Transistor" },
    "Mikrokontroler": { id: "Mikrokontroler", en: "Microcontroller" },
    "Sensor": { id: "Sensor", en: "Sensor" },
    "Regulator / Power IC": { id: "Regulator / Power IC", en: "Regulator / Power IC" },
    "Op-Amp / Analog": { id: "Op-Amp / Analog", en: "Op-Amp / Analog" },
    "Konektor": { id: "Konektor", en: "Connector" },
    "Lainnya": { id: "Lainnya", en: "Other" }
  };

  /* Typical CORE components only (big/important parts), no small
     parts (R/C/LED/etc.) and no prices, per project brief. */
  var SPEC_COMPONENTS = {
    motor: {
      id: ["Mikrokontroler (MCU)", "Gate driver", "MOSFET power stage", "Sensor arus", "Konektor daya &amp; sinyal"],
      en: ["Microcontroller (MCU)", "Gate driver", "MOSFET power stage", "Current sensor", "Power &amp; signal connectors"]
    },
    iot: {
      id: ["MCU / modul wireless", "Regulator tegangan", "Sensor (sesuai kebutuhan)", "Konektor"],
      en: ["MCU / wireless module", "Voltage regulator", "Sensor (as needed)", "Connectors"]
    },
    power: {
      id: ["Regulator / konverter daya", "Dioda", "Induktor", "Kapasitor daya", "Konektor &amp; proteksi"],
      en: ["Power regulator / converter", "Diode", "Inductor", "Power capacitor", "Connectors &amp; protection"]
    },
    sensor: {
      id: ["MCU", "AFE / ADC", "Sensor", "Konektor antarmuka"],
      en: ["MCU", "AFE / ADC", "Sensor", "Interface connector"]
    },
    lainnya: {
      id: ["Ceritakan proyekmu di form, komponen inti kita bahas langsung."],
      en: ["Tell us about your project in the form, we'll go over the core components together."]
    }
  };

  var specState = { project: null, mcu: null, layer: null };

  function currentLang() {
    return root.getAttribute("data-lang") === "en" ? "en" : "id";
  }

  function specLabel(group, value) {
    var entry = SPEC_LABELS[group] && SPEC_LABELS[group][value];
    if (!entry) return "";
    return entry[currentLang()];
  }

  function setStepLocked(stepName, locked) {
    var step = document.querySelector('.selector-step[data-step="' + stepName + '"]');
    if (step) step.setAttribute("data-locked", locked ? "true" : "false");
  }

  function selectOption(group, btn) {
    var container = btn.closest(".selector-options");
    if (!container) return;
    container.querySelectorAll(".selector-option").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    specState[group] = btn.getAttribute("data-value");

    if (group === "project") {
      setStepLocked("mcu", false);
    }
    if (group === "mcu") {
      setStepLocked("layer", false);
    }
    if (group === "layer") {
      setStepLocked("parts", false);
      renderSpecResult();
    }
  }

  function priceForLayer(layer) {
    if (layer === "single") {
      return {
        id: "Rp 100.000",
        idSmall: "harga jasa desain",
        en: "Rp 100,000",
        enSmall: "design service price"
      };
    }
    if (layer === "double") {
      return {
        id: "Rp 150.000",
        idSmall: "harga jasa desain",
        en: "Rp 150,000",
        enSmall: "design service price"
      };
    }
    if (layer === "multilayer") {
      return {
        id: "Rp 200.000",
        idSmall: "harga jasa desain",
        en: "Rp 200,000",
        enSmall: "design service price"
      };
    }
    return {
      id: "Rp 100.000 - Rp 200.000",
      idSmall: "dipastikan setelah konsultasi",
      en: "Rp 100,000 - Rp 200,000",
      enSmall: "confirmed after consultation"
    };
  }

  /* ---------- Komponen khusus (multi-row: kategori + part number) ---------- */
  function collectParts() {
    var rows = document.querySelectorAll("#parts-rows .parts-row");
    var parts = [];
    rows.forEach(function (row) {
      var select = row.querySelector(".parts-category");
      var input = row.querySelector(".parts-value");
      if (!select || !input) return;
      var value = input.value.trim();
      if (!value) return;
      parts.push({ category: select.value, value: value });
    });
    return parts;
  }

  function partsCategoryLabel(category, lang) {
    var entry = PARTS_CATEGORY_LABELS[category];
    if (!entry) return category;
    return entry[lang] || category;
  }

  function partsSummaryLines(lang) {
    var parts = collectParts();
    if (!parts.length) return [];
    return parts.map(function (p) {
      return partsCategoryLabel(p.category, lang) + " = " + p.value;
    });
  }

  function addPartsRow() {
    var container = document.getElementById("parts-rows");
    if (!container) return;
    var template = container.querySelector(".parts-row");
    if (!template) return;
    var clone = template.cloneNode(true);
    var select = clone.querySelector(".parts-category");
    var input = clone.querySelector(".parts-value");
    if (select) select.selectedIndex = 0;
    if (input) input.value = "";
    container.appendChild(clone);
    bindPartsRow(clone);
    updatePartsRemoveState();
  }

  function removePartsRow(row) {
    var container = document.getElementById("parts-rows");
    if (!container) return;
    var rows = container.querySelectorAll(".parts-row");
    if (rows.length <= 1) return;
    row.remove();
    updatePartsRemoveState();
    renderSpecResult();
  }

  function updatePartsRemoveState() {
    var rows = document.querySelectorAll("#parts-rows .parts-row");
    rows.forEach(function (row) {
      var btn = row.querySelector(".parts-remove");
      if (!btn) return;
      if (rows.length <= 1) {
        btn.setAttribute("disabled", "disabled");
      } else {
        btn.removeAttribute("disabled");
      }
    });
  }

  function bindPartsRow(row) {
    var input = row.querySelector(".parts-value");
    var removeBtn = row.querySelector(".parts-remove");
    if (input) {
      input.addEventListener("input", function () {
        renderSpecResult();
      });
    }
    var select = row.querySelector(".parts-category");
    if (select) {
      select.addEventListener("change", function () {
        renderSpecResult();
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        removePartsRow(row);
      });
    }
  }

  function initPartsRows() {
    var container = document.getElementById("parts-rows");
    if (!container) return;
    container.querySelectorAll(".parts-row").forEach(bindPartsRow);
    updatePartsRemoveState();
    var addBtn = document.getElementById("parts-add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", addPartsRow);
    }
  }

  function resetPartsRows() {
    var container = document.getElementById("parts-rows");
    if (!container) return;
    var rows = container.querySelectorAll(".parts-row");
    rows.forEach(function (row, idx) {
      if (idx === 0) {
        var select = row.querySelector(".parts-category");
        var input = row.querySelector(".parts-value");
        if (select) select.selectedIndex = 0;
        if (input) input.value = "";
      } else {
        row.remove();
      }
    });
    updatePartsRemoveState();
  }

  function renderSpecResult() {
    var panel = document.getElementById("spec-result");
    var summaryEl = document.getElementById("spec-summary");
    var priceEl = document.getElementById("spec-price");
    var componentsEl = document.getElementById("spec-components");
    if (!panel || !summaryEl || !priceEl || !componentsEl) return;

    var lang = currentLang();
    var mcuLabel = specState.mcu ? specLabel("mcu", specState.mcu) : (lang === "en" ? "Not specified" : "Belum dipilih");
    var partsLines = partsSummaryLines(lang);
    var partsLabel = partsLines.length
      ? partsLines.join("; ")
      : (lang === "en" ? "None specified" : "Tidak ada");

    var summaryItemsId = [
      { label: "Jenis Proyek", value: specLabel("project", specState.project) },
      { label: "Mikrokontroler", value: mcuLabel },
      { label: "Jumlah Layer", value: specLabel("layer", specState.layer) },
      { label: "Komponen Khusus", value: partsLabel }
    ];
    var summaryItemsEn = [
      { label: "Project Type", value: specLabel("project", specState.project) },
      { label: "Microcontroller", value: mcuLabel },
      { label: "Layer Count", value: specLabel("layer", specState.layer) },
      { label: "Specific Components", value: partsLabel }
    ];
    var items = lang === "en" ? summaryItemsEn : summaryItemsId;
    summaryEl.innerHTML = items.map(function (it) {
      return '<div class="spec-summary-item"><span class="label">' + it.label + '</span><span class="value">' + it.value + "</span></div>";
    }).join("");

    var price = priceForLayer(specState.layer);
    priceEl.innerHTML = (lang === "en" ? price.en : price.id) +
      "<small>" + (lang === "en" ? price.enSmall : price.idSmall) + "</small>";

    var comps = SPEC_COMPONENTS[specState.project] || SPEC_COMPONENTS.lainnya;
    var list = lang === "en" ? comps.en : comps.id;
    componentsEl.innerHTML = list.map(function (c) { return "<li>" + c + "</li>"; }).join("");

    panel.classList.add("visible");
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    fillSpecSummaryIntoForm();
  }

  function fillSpecSummaryIntoForm() {
    var textarea = document.getElementById("cf-spec");
    if (!textarea) return;
    var lang = currentLang();
    var price = priceForLayer(specState.layer);
    var priceText = lang === "en" ? price.en : price.id;
    var mcuLabel = specState.mcu ? specLabel("mcu", specState.mcu) : (lang === "en" ? "not specified" : "belum dipilih");
    var partsLines = partsSummaryLines(lang);

    var lines;
    if (lang === "en") {
      lines = [
        "Project type: " + specLabel("project", specState.project),
        "Microcontroller: " + mcuLabel,
        "Layers: " + specLabel("layer", specState.layer),
        "Design service price: " + priceText,
        "Specific components: " + (partsLines.length ? partsLines.join("; ") : "none specified")
      ];
    } else {
      lines = [
        "Jenis proyek: " + specLabel("project", specState.project),
        "Mikrokontroler: " + mcuLabel,
        "Jumlah layer: " + specLabel("layer", specState.layer),
        "Harga jasa desain: " + priceText,
        "Komponen khusus: " + (partsLines.length ? partsLines.join("; ") : "tidak ada")
      ];
    }
    textarea.value = lines.join("\n");
  }

  function resetSelector() {
    specState = { project: null, mcu: null, layer: null };
    document.querySelectorAll(".selector-option").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    setStepLocked("mcu", true);
    setStepLocked("layer", true);
    setStepLocked("parts", true);
    resetPartsRows();
    var panel = document.getElementById("spec-result");
    if (panel) panel.classList.remove("visible");
    var textarea = document.getElementById("cf-spec");
    if (textarea) textarea.value = "";
  }

  function initSpecSelector() {
    var selector = document.getElementById("spec-selector");
    if (!selector) return;

    selector.querySelectorAll(".selector-options").forEach(function (group) {
      var groupName = group.getAttribute("data-group");
      group.querySelectorAll(".selector-option").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var step = btn.closest(".selector-step");
          if (step && step.getAttribute("data-locked") === "true") return;
          selectOption(groupName, btn);
        });
      });
    });

    initPartsRows();

    var resetBtn = document.getElementById("selector-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetSelector);
    }
  }

  /* =========================================================
     Contact form (Web3Forms), async submit with graceful
     fallback to normal form POST if fetch/JS fails.
     ========================================================= */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("contact-submit-btn");
    if (!form || !statusEl) return;

    function showStatus(kind, textId, textEn) {
      statusEl.classList.remove("success", "error");
      if (kind) statusEl.classList.add(kind);
      statusEl.classList.add("visible");
      statusEl.textContent = currentLang() === "en" ? textEn : textId;
    }

    var isSubmitting = false;

    form.addEventListener("submit", function (e) {
      // Only intercept if fetch is available; otherwise let the
      // browser submit the form normally (fallback for no-JS / old browsers).
      if (typeof window.fetch !== "function") return;

      e.preventDefault();

      // Guard against double-submit while a request is in flight.
      if (isSubmitting) return;
      isSubmitting = true;
      if (submitBtn) submitBtn.setAttribute("disabled", "disabled");

      showStatus(
        "",
        "Mengirim spesifikasimu...",
        "Sending your spec..."
      );

      var formData = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          return response.json()
            .catch(function () { return {}; })
            .then(function (data) {
              // Attach HTTP status so we can detect rate limiting (429).
              data.__status = response.status;
              return data;
            });
        })
        .then(function (data) {
          if (data && data.success) {
            showStatus(
              "success",
              "Terima kasih! Spesifikasimu terkirim, kami balas via kontak yang kamu isi.",
              "Thank you! Your spec has been sent, we'll reply via the contact you provided."
            );
            form.reset();
          } else if (data && data.__status === 429) {
            showStatus(
              "error",
              "Terlalu cepat mengirim ulang. Tunggu sekitar satu menit, lalu coba lagi.",
              "Sending again too quickly. Please wait about a minute, then try again."
            );
          } else {
            showStatus(
              "error",
              "Gagal mengirim. Coba lagi sebentar, atau pastikan koneksi internetmu stabil.",
              "Failed to send. Please try again shortly, or check your internet connection."
            );
          }
        })
        .catch(function () {
          showStatus(
            "error",
            "Gagal mengirim. Coba lagi sebentar, atau pastikan koneksi internetmu stabil.",
            "Failed to send. Please try again shortly, or check your internet connection."
          );
        })
        .finally(function () {
          isSubmitting = false;
          if (submitBtn) submitBtn.removeAttribute("disabled");
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initLang();
    initNav();
    initYear();
    initFaq();
    initSpecSelector();
    initContactForm();
  });
})();
