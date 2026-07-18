/* =========================================================
   RangkaiPCB, Simulasi Alur Pemesanan (simulasi.html)
   PROTOTIPE localStorage, TIDAK ADA BACKEND.
   Vanilla JS, no dependencies, no build step.

   State pesanan disimpan di localStorage dengan key "rs-sim-order"
   (prefiks "rs-sim-" agar tak bentrok dengan "rs-theme" / "rs-lang"
   milik assets/js/main.js). Panel klien & admin membaca state yang
   sama dan re-render penuh setiap ada perubahan, jadi keduanya selalu
   sinkron dalam satu tab/browser yang sama.

   Saat backend sungguhan dibangun: ganti loadOrder()/saveOrder() di
   bawah ini dengan panggilan API (GET/POST) ke server, dan tambahkan
   autentikasi admin sebelum aksi admin diizinkan.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "rs-sim-order";
  var MAX_REVISIONS = 2;
  var TOTAL_STAGES = 8;

  var STAGE_NAMES = {
    id: {
      1: "Spesifikasi Terpilih",
      2: "Estimasi &amp; Kesepakatan",
      3: "Down Payment",
      4: "Pengerjaan Desain",
      5: "Review Klien",
      6: "Revisi",
      7: "Pelunasan",
      8: "Serah Terima"
    },
    en: {
      1: "Spec Selected",
      2: "Estimate &amp; Agreement",
      3: "Down Payment",
      4: "Design in Progress",
      5: "Client Review",
      6: "Revision",
      7: "Final Payment",
      8: "Handover"
    }
  };

  var LAYER_LABELS = {
    single: { id: "Single Layer", en: "Single Layer" },
    double: { id: "Double Layer", en: "Double Layer" },
    multilayer: { id: "Multilayer 4 Layer+", en: "Multilayer 4 Layer+" }
  };

  var LAYER_PRICE = {
    single: { id: "Rp 100.000", en: "Rp 100,000", dp: false },
    double: { id: "Rp 150.000", en: "Rp 150,000", dp: false },
    multilayer: { id: "Rp 200.000 (DP 50%)", en: "Rp 200,000 (50% DP)", dp: true }
  };

  var SAMPLE_SPEC = {
    project: "Motor Controller DC/BLDC",
    layer: "multilayer",
    notes: {
      id: "Driver motor BLDC 3-fasa untuk purwarupa robot kecil, butuh sensing arus.",
      en: "3-phase BLDC motor driver for a small robot prototype, needs current sensing."
    }
  };

  function currentLang() {
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "id";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function formatTimestamp(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString(currentLang() === "en" ? "en-GB" : "id-ID", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    } catch (e) {
      return iso;
    }
  }

  /* ---------- State load/save (localStorage, single browser only) ---------- */
  function loadOrder() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) { /* ignore corrupt state */ }
    return null;
  }

  function saveOrder(order) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch (e) { /* ignore */ }
  }

  function clearOrder() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function newOrderId() {
    return "SIM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  var order = loadOrder();

  function pushHistory(stage, labelId, labelEn) {
    order.history = order.history || [];
    order.history.push({
      stage: stage,
      labelId: labelId,
      labelEn: labelEn,
      timestamp: nowIso()
    });
  }

  /* ---------- Transitions ---------- */
  function createOrder(spec) {
    order = {
      id: newOrderId(),
      spec: spec,
      currentStage: 1,
      revisionCount: 0,
      adminNotes: "",
      deliverableName: "",
      history: []
    };
    pushHistory(1, STAGE_NAMES.id[1], STAGE_NAMES.en[1]);
    saveOrder(order);
    render();
  }

  function advanceStage(targetStage, labelIdOverride, labelEnOverride) {
    if (!order) return;
    order.currentStage = targetStage;
    var labelId = labelIdOverride || STAGE_NAMES.id[targetStage];
    var labelEn = labelEnOverride || STAGE_NAMES.en[targetStage];
    pushHistory(targetStage, labelId, labelEn);
    saveOrder(order);
    render();
  }

  function requestRevision() {
    if (!order || order.revisionCount >= MAX_REVISIONS) return;
    order.revisionCount += 1;
    order.currentStage = 4; // kembali ke Pengerjaan Desain
    var labelId = "Revisi " + order.revisionCount + " diminta, kembali ke Pengerjaan Desain";
    var labelEn = "Revision " + order.revisionCount + " requested, back to Design in Progress";
    pushHistory(4, labelId, labelEn);
    saveOrder(order);
    render();
  }

  function saveAdminFields() {
    if (!order) return;
    var notesEl = document.getElementById("sim-admin-notes");
    var deliverableEl = document.getElementById("sim-admin-deliverable");
    if (notesEl) order.adminNotes = notesEl.value;
    if (deliverableEl) order.deliverableName = deliverableEl.value;
    saveOrder(order);
  }

  function resetSimulation() {
    clearOrder();
    order = null;
    render();
  }

  /* ---------- Render: stepper ---------- */
  function renderStepper() {
    var items = document.querySelectorAll("#sim-stepper .stepper-item");
    var current = order ? order.currentStage : 0;
    items.forEach(function (item) {
      var stage = parseInt(item.getAttribute("data-stage"), 10);
      if (!order) {
        item.removeAttribute("data-status");
        return;
      }
      if (stage < current) {
        item.setAttribute("data-status", "done");
      } else if (stage === current) {
        item.setAttribute("data-status", "active");
      } else {
        item.removeAttribute("data-status");
      }
    });

    var line = document.getElementById("sim-status-line");
    if (!line) return;
    var lang = currentLang();
    if (!order) {
      line.textContent = lang === "en"
        ? "No simulated order yet."
        : "Belum ada pesanan simulasi.";
      return;
    }
    var stageLabel = lang === "en" ? STAGE_NAMES.en[order.currentStage] : STAGE_NAMES.id[order.currentStage];
    // strip HTML entity for plain textContent readability
    stageLabel = stageLabel.replace(/&amp;/g, "&").replace(/&times;/g, "x");
    var template = lang === "en"
      ? "Order " + order.id + " &middot; current stage: " + (order.currentStage) + "/" + TOTAL_STAGES + " (" + stageLabel + ")" + (order.revisionCount ? " &middot; revisions used: " + order.revisionCount + "/" + MAX_REVISIONS : "")
      : "Pesanan " + order.id + " &middot; tahap saat ini: " + (order.currentStage) + "/" + TOTAL_STAGES + " (" + stageLabel + ")" + (order.revisionCount ? " &middot; revisi terpakai: " + order.revisionCount + "/" + MAX_REVISIONS : "");
    line.innerHTML = template;
  }

  /* ---------- Render: client panel ---------- */
  function specLayerLabel(layer, lang) {
    var entry = LAYER_LABELS[layer];
    return entry ? entry[lang] : layer;
  }

  function specPriceLabel(layer, lang) {
    var entry = LAYER_PRICE[layer];
    return entry ? entry[lang] : "";
  }

  function renderOrderSummary() {
    var block = document.getElementById("sim-order-summary");
    var grid = document.getElementById("sim-summary-grid");
    var specInput = document.getElementById("sim-spec-input");
    if (!block || !grid || !specInput) return;

    if (!order) {
      block.hidden = true;
      specInput.hidden = false;
      return;
    }

    specInput.hidden = true;
    block.hidden = false;
    var lang = currentLang();
    var spec = order.spec;
    var notes = spec.notes && typeof spec.notes === "object" ? (spec.notes[lang] || spec.notes.id || "") : (spec.notes || "");

    var items = lang === "en"
      ? [
        { label: "Order ID", value: order.id },
        { label: "Project Type", value: spec.project },
        { label: "PCB Layers", value: specLayerLabel(spec.layer, "en") },
        { label: "Design Service Price", value: specPriceLabel(spec.layer, "en") },
        { label: "Notes", value: notes || "-", wide: true }
      ]
      : [
        { label: "ID Pesanan", value: order.id },
        { label: "Jenis Proyek", value: spec.project },
        { label: "Layer PCB", value: specLayerLabel(spec.layer, "id") },
        { label: "Harga Jasa Desain", value: specPriceLabel(spec.layer, "id") },
        { label: "Catatan", value: notes || "-", wide: true }
      ];

    grid.innerHTML = items.map(function (it) {
      var cls = it.wide ? "spec-summary-item spec-summary-item--wide" : "spec-summary-item";
      return '<div class="' + cls + '"><span class="label">' + it.label + '</span><span class="value">' + escapeHtml(it.value) + "</span></div>";
    }).join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderClientActions() {
    var block = document.getElementById("sim-client-actions");
    var hint = document.getElementById("sim-client-hint");
    var buttons = document.getElementById("sim-client-buttons");
    if (!block || !hint || !buttons) return;

    if (!order) {
      block.hidden = true;
      return;
    }
    block.hidden = false;
    var lang = currentLang();
    buttons.innerHTML = "";

    var stage = order.currentStage;

    if (stage === 2) {
      hint.textContent = lang === "en"
        ? "Admin has proposed a price & estimate. Confirm to proceed to down payment."
        : "Admin sudah mengajukan harga & estimasi. Konfirmasi untuk lanjut ke down payment.";
      buttons.appendChild(makeButton(
        lang === "en" ? "Confirm price & agree" : "Konfirmasi harga & setuju",
        function () { advanceStage(3); },
        "btn-primary"
      ));
    } else if (stage === 3) {
      var dp = LAYER_PRICE[order.spec.layer] && LAYER_PRICE[order.spec.layer].dp;
      hint.textContent = lang === "en"
        ? (dp ? "Multilayer package: pay 50% down payment (simulation) to start work." : "Single/Double package: pay in full upfront (simulation) to start work.")
        : (dp ? "Paket Multilayer: bayar DP 50% (simulasi) untuk mulai pengerjaan." : "Paket Single/Double: bayar lunas di muka (simulasi) untuk mulai pengerjaan.");
      buttons.appendChild(makeButton(
        lang === "en" ? "Confirm DP payment (simulation)" : "Konfirmasi bayar DP (simulasi)",
        function () { advanceStage(4); },
        "btn-primary"
      ));
    } else if (stage === 5) {
      hint.textContent = lang === "en"
        ? "Admin sent a 3D preview (simulation). Approve the design or request a revision."
        : "Admin sudah mengirim tampilan 3D (simulasi). Setujui desain atau minta revisi.";
      buttons.appendChild(makeButton(
        lang === "en" ? "Approve design" : "Setujui desain",
        function () { advanceStage(7); },
        "btn-primary"
      ));
      var revisionsLeft = MAX_REVISIONS - order.revisionCount;
      var revisionBtn = makeButton(
        lang === "en" ? "Request revision (" + revisionsLeft + " left)" : "Minta revisi (" + revisionsLeft + " tersisa)",
        function () { requestRevision(); },
        "btn-outline"
      );
      if (revisionsLeft <= 0) {
        revisionBtn.setAttribute("disabled", "disabled");
      }
      buttons.appendChild(revisionBtn);
      if (revisionsLeft <= 0) {
        var limitMsg = document.createElement("p");
        limitMsg.className = "sim-action-hint";
        limitMsg.textContent = lang === "en" ? "Revision limit reached." : "Batas revisi tercapai.";
        buttons.appendChild(limitMsg);
      }
    } else if (stage === 7) {
      hint.textContent = lang === "en"
        ? "Design approved. Settle the remaining balance (simulation) to receive final files."
        : "Desain sudah disetujui. Lunasi sisa pembayaran (simulasi) untuk menerima file final.";
      buttons.appendChild(makeButton(
        lang === "en" ? "Confirm final payment (simulation)" : "Konfirmasi pelunasan (simulasi)",
        function () { advanceStage(8, STAGE_NAMES.id[7] + " (lunas)", STAGE_NAMES.en[7] + " (settled)"); },
        "btn-primary"
      ));
    } else if (stage === 8) {
      hint.textContent = lang === "en"
        ? "Order complete. Deliverable: " + (order.deliverableName || "(not filled by admin yet)")
        : "Pesanan selesai. File hasil: " + (order.deliverableName || "(belum diisi admin)");
    } else {
      hint.textContent = lang === "en"
        ? "Waiting on admin action for this stage."
        : "Menunggu aksi admin untuk tahap ini.";
    }
  }

  function makeButton(text, onClick, extraClass) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn " + (extraClass || "btn-outline");
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  /* ---------- Render: admin panel ---------- */
  function renderAdminPanel() {
    var empty = document.getElementById("sim-admin-empty");
    var actionsBlock = document.getElementById("sim-admin-actions");
    var fieldsBlock = document.getElementById("sim-admin-fields");
    var hint = document.getElementById("sim-admin-hint");
    var buttons = document.getElementById("sim-admin-buttons");
    if (!empty || !actionsBlock || !fieldsBlock || !hint || !buttons) return;

    if (!order) {
      empty.hidden = false;
      actionsBlock.hidden = true;
      fieldsBlock.hidden = true;
      return;
    }

    empty.hidden = true;
    actionsBlock.hidden = false;
    fieldsBlock.hidden = false;

    var notesEl = document.getElementById("sim-admin-notes");
    var deliverableEl = document.getElementById("sim-admin-deliverable");
    if (notesEl && document.activeElement !== notesEl) notesEl.value = order.adminNotes || "";
    if (deliverableEl && document.activeElement !== deliverableEl) deliverableEl.value = order.deliverableName || "";

    var lang = currentLang();
    buttons.innerHTML = "";
    var stage = order.currentStage;

    if (stage === 1) {
      hint.textContent = lang === "en"
        ? "Client submitted a spec. Verify it and propose a price & estimate."
        : "Klien sudah mengirim spesifikasi. Verifikasi lalu ajukan harga & estimasi.";
      buttons.appendChild(makeButton(
        lang === "en" ? "Mark verified, propose price" : "Tandai terverifikasi, ajukan harga",
        function () { advanceStage(2); },
        "btn-primary"
      ));
    } else if (stage === 2) {
      hint.textContent = lang === "en"
        ? "Waiting for client to confirm the price & agreement."
        : "Menunggu klien mengonfirmasi harga & kesepakatan.";
    } else if (stage === 3) {
      hint.textContent = lang === "en"
        ? "Waiting for down payment (simulation) from client."
        : "Menunggu down payment (simulasi) dari klien.";
    } else if (stage === 4) {
      hint.textContent = lang === "en"
        ? "Work in progress. Mark as started, then send for client review when the 3D preview is ready."
        : "Pengerjaan berjalan. Tandai mulai, lalu kirim untuk review saat tampilan 3D siap.";
      buttons.appendChild(makeButton(
        lang === "en" ? "Start work" : "Mulai pengerjaan",
        function () { advanceStage(4, STAGE_NAMES.id[4] + " (dimulai)", STAGE_NAMES.en[4] + " (started)"); },
        "btn-outline"
      ));
      buttons.appendChild(makeButton(
        lang === "en" ? "Send for review (3D preview, simulation)" : "Kirim untuk review (tampilan 3D, simulasi)",
        function () { advanceStage(5); },
        "btn-primary"
      ));
    } else if (stage === 5) {
      hint.textContent = lang === "en"
        ? "Waiting for client to review: approve, or request a revision."
        : "Menunggu review klien: setuju, atau minta revisi.";
    } else if (stage === 7) {
      hint.textContent = lang === "en"
        ? "Waiting for the client's final payment (simulation)."
        : "Menunggu pelunasan (simulasi) dari klien.";
    } else if (stage === 8) {
      hint.textContent = lang === "en"
        ? "Final payment received. Hand over the final deliverable file name below, then confirm handover."
        : "Pelunasan sudah diterima. Isi nama file hasil final di bawah, lalu konfirmasi serah terima.";
      var handoverBtn = makeButton(
        lang === "en" ? "Confirm handover / send result" : "Serah terima / kirim hasil",
        function () {
          saveAdminFields();
          if (!order.deliverableName) {
            hint.textContent = lang === "en"
              ? "Fill in the deliverable file name first."
              : "Isi dulu nama file hasil di bawah.";
            return;
          }
          pushHistory(8, STAGE_NAMES.id[8] + ": " + order.deliverableName, STAGE_NAMES.en[8] + ": " + order.deliverableName);
          saveOrder(order);
          render();
        },
        "btn-primary"
      );
      buttons.appendChild(handoverBtn);
    } else {
      hint.textContent = lang === "en" ? "No admin action available for this stage." : "Tidak ada aksi admin untuk tahap ini.";
    }
  }

  function bindAdminFieldAutosave() {
    var notesEl = document.getElementById("sim-admin-notes");
    var deliverableEl = document.getElementById("sim-admin-deliverable");
    if (notesEl) {
      notesEl.addEventListener("input", function () {
        if (!order) return;
        order.adminNotes = notesEl.value;
        saveOrder(order);
      });
    }
    if (deliverableEl) {
      deliverableEl.addEventListener("input", function () {
        if (!order) return;
        order.deliverableName = deliverableEl.value;
        saveOrder(order);
      });
    }
  }

  /* ---------- Render: history ---------- */
  function renderHistory() {
    var block = document.getElementById("sim-history-block");
    var list = document.getElementById("sim-history-list");
    if (!block || !list) return;
    if (!order || !order.history || !order.history.length) {
      block.hidden = true;
      list.innerHTML = "";
      return;
    }
    block.hidden = false;
    var lang = currentLang();
    var rows = order.history.slice().reverse().map(function (h) {
      var label = lang === "en" ? (h.labelEn || h.labelId) : (h.labelId || h.labelEn);
      return '<li><span class="sim-history-label">' + label + '</span><span>' + formatTimestamp(h.timestamp) + "</span></li>";
    });
    list.innerHTML = rows.join("");
  }

  /* ---------- Full render ---------- */
  function render() {
    renderStepper();
    renderOrderSummary();
    renderClientActions();
    renderAdminPanel();
    renderHistory();
  }

  /* ---------- Init: spec input (client side) ---------- */
  function collectSpecFromForm() {
    var projectEl = document.getElementById("sim-spec-project");
    var layerEl = document.getElementById("sim-spec-layer");
    var notesEl = document.getElementById("sim-spec-notes");
    var lang = currentLang();
    var projectValue = projectEl ? projectEl.options[projectEl.selectedIndex].getAttribute(lang === "en" ? "data-lang-en" : "data-lang-id") || projectEl.value : "";
    return {
      project: projectValue,
      layer: layerEl ? layerEl.value : "single",
      notes: { id: notesEl ? notesEl.value : "", en: notesEl ? notesEl.value : "" }
    };
  }

  function initSpecInput() {
    var sampleBtn = document.getElementById("sim-spec-sample");
    var submitBtn = document.getElementById("sim-spec-submit");
    var projectEl = document.getElementById("sim-spec-project");
    var layerEl = document.getElementById("sim-spec-layer");
    var notesEl = document.getElementById("sim-spec-notes");

    if (sampleBtn) {
      sampleBtn.addEventListener("click", function () {
        if (projectEl) {
          for (var i = 0; i < projectEl.options.length; i++) {
            if (projectEl.options[i].value === SAMPLE_SPEC.project) {
              projectEl.selectedIndex = i;
              break;
            }
          }
        }
        if (layerEl) layerEl.value = SAMPLE_SPEC.layer;
        if (notesEl) notesEl.value = currentLang() === "en" ? SAMPLE_SPEC.notes.en : SAMPLE_SPEC.notes.id;
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", function () {
        var spec = collectSpecFromForm();
        createOrder(spec);
      });
    }
  }

  function initReset() {
    var btn = document.getElementById("sim-reset-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      resetSimulation();
    });
  }

  /* Re-render on language toggle so labels stay in sync (main.js swaps
     data-lang-id/data-lang-en text; we still need to re-render dynamic
     JS-built content like the summary grid, hints, and history list). */
  function initLangObserver() {
    var langButtons = document.querySelectorAll(".lang-toggle button");
    langButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        // main.js already swapped static text; re-render dynamic bits after.
        setTimeout(render, 0);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSpecInput();
    initReset();
    bindAdminFieldAutosave();
    initLangObserver();
    render();
  });
})();
