/* Praxis Knüvener – Entwurf. Kein Tracking, keine externen Dienste. */
(function () {
  "use strict";
  var html = document.documentElement;
  html.classList.add("js");

  /* Einstellungen merken (Schriftgröße, Kontrast) */
  function pref(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function setPref(key, v) { try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch (e) {} }
  var fs = pref("pk-fs"); if (fs) html.classList.add("fs-" + fs);
  if (pref("pk-contrast") === "1") html.classList.add("contrast");

  var fsBtn = document.getElementById("btn-font");
  if (fsBtn) {
    var sync = function () { var on = html.classList.contains("fs-1") || html.classList.contains("fs-2"); fsBtn.setAttribute("aria-pressed", on ? "true" : "false"); };
    fsBtn.addEventListener("click", function () {
      if (html.classList.contains("fs-2")) { html.classList.remove("fs-2"); setPref("pk-fs", null); }
      else if (html.classList.contains("fs-1")) { html.classList.remove("fs-1"); html.classList.add("fs-2"); setPref("pk-fs", "2"); }
      else { html.classList.add("fs-1"); setPref("pk-fs", "1"); }
      sync();
    });
    sync();
  }
  var cBtn = document.getElementById("btn-contrast");
  if (cBtn) {
    cBtn.setAttribute("aria-pressed", html.classList.contains("contrast") ? "true" : "false");
    cBtn.addEventListener("click", function () {
      var on = html.classList.toggle("contrast");
      setPref("pk-contrast", on ? "1" : null);
      cBtn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* Menü auf dem Handy */
  var tog = document.querySelector(".nav-toggle"), nav = document.getElementById("hauptmenue");
  if (tog && nav) {
    tog.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      tog.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Status „Heute“: Sprechzeiten und Praxisurlaub der Praxis (Stand Oktober 2026) */
  var ZEITEN = { 1: [[9, 0, 12, 0], [16, 0, 18, 0]], 2: [[9, 0, 12, 0], [16, 0, 18, 0]], 3: [[9, 0, 12, 0]], 4: [[9, 0, 12, 0], [17, 0, 19, 0]], 5: [[9, 0, 12, 0]] };
  var URLAUB = [
    ["2026-01-02", "2026-01-02"], ["2026-04-20", "2026-04-21"], ["2026-04-27", "2026-05-08"], ["2026-06-05", "2026-06-05"],
    ["2026-08-17", "2026-09-04"], ["2026-10-19", "2026-10-23"], ["2026-12-23", "2026-12-30"]
  ];
  var FEIERTAGE = ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25", "2026-06-04", "2026-10-03", "2026-11-01", "2026-12-25", "2026-12-26", "2027-01-01"];
  var VERTRETUNG = "Praxen Grothe-Hütter, Schmiemann und Gesenhues";
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fmtDate(s) { var p = s.split("-"); return p[2] + "." + p[1] + "."; }
  function fmtTime(h, m) { return h + ":" + ("0" + m).slice(-2) + " Uhr"; }
  function urlaubAm(s) { for (var i = 0; i < URLAUB.length; i++) if (s >= URLAUB[i][0] && s <= URLAUB[i][1]) return URLAUB[i]; return null; }
  function geschlossenAm(d) { var s = iso(d); return !ZEITEN[d.getDay()] || FEIERTAGE.indexOf(s) >= 0 || urlaubAm(s); }
  function naechsteOeffnung(von) {
    var d = new Date(von.getFullYear(), von.getMonth(), von.getDate());
    for (var i = 0; i < 40; i++) {
      if (!geschlossenAm(d)) {
        var z = ZEITEN[d.getDay()];
        for (var k = 0; k < z.length; k++) {
          var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), z[k][0], z[k][1]);
          if (t > von) return { tag: d, h: z[k][0], m: z[k][1], heute: i === 0 };
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }
  function status(now) {
    var s = iso(now), u = urlaubAm(s), box = document.getElementById("status"), st = document.getElementById("status-state"), tx = document.getElementById("status-text"), vt = document.getElementById("status-vertretung");
    if (!box || !st || !tx) return;
    var n = naechsteOeffnung(now), nt = "";
    if (n) nt = (n.heute ? "heute" : (n.tag.getTime() - now.getTime() < 6 * 864e5 ? "am " + TAGE[n.tag.getDay()] + ", " + fmtDate(iso(n.tag)) : "am " + fmtDate(iso(n.tag)))) + " um " + fmtTime(n.h, n.m);
    box.classList.remove("open", "closed", "urlaub");
    if (u) {
      box.classList.add("urlaub");
      st.textContent = "Praxisurlaub bis " + fmtDate(u[1]);
      tx.textContent = "Die Praxis öffnet wieder " + nt + ".";
      if (vt) { vt.hidden = false; vt.textContent = "Vertretung: " + VERTRETUNG + ". Im Notfall: 116117 oder 112."; }
      return;
    }
    if (vt) vt.hidden = true;
    var z = geschlossenAm(now) ? [] : ZEITEN[now.getDay()], min = now.getHours() * 60 + now.getMinutes();
    for (var k = 0; k < z.length; k++) {
      var a = z[k][0] * 60 + z[k][1], b = z[k][2] * 60 + z[k][3];
      if (min >= a && min < b) {
        box.classList.add("open");
        st.textContent = "Jetzt geöffnet, bis " + fmtTime(z[k][2], z[k][3]);
        var rest = z[k + 1] ? "Heute außerdem " + fmtTime(z[k + 1][0], z[k + 1][1]) + " bis " + fmtTime(z[k + 1][2], z[k + 1][3]) + ". " : "";
        tx.textContent = rest + "Wir bitten um telefonische Terminabsprache: 02565 3333.";
        return;
      }
    }
    box.classList.add("closed");
    st.textContent = "Zurzeit geschlossen";
    tx.textContent = n ? "Die Praxis öffnet wieder " + nt + "." : "Bitte beachten Sie die Sprechzeiten.";
  }
  try { status(new Date()); } catch (e) {}

  /* Urlaubsliste: vergangene Zeiträume abblenden */
  var heute = iso(new Date());
  var li = document.querySelectorAll(".urlaub li[data-bis]");
  for (var i = 0; i < li.length; i++) if (li[i].getAttribute("data-bis") < heute) li[i].classList.add("past");

  /* Formulare: Weichen und Demo-Versand */
  var weiche = document.querySelectorAll("[data-weiche]");
  function zeigeWeiche(form) {
    var sel = form.querySelector("input[name=anliegen]:checked");
    var panels = form.querySelectorAll("[data-panel]");
    for (var p = 0; p < panels.length; p++) {
      var on = sel && panels[p].getAttribute("data-panel").split(" ").indexOf(sel.value) >= 0;
      panels[p].hidden = !on;
      var req = panels[p].querySelectorAll("[data-required]");
      for (var r = 0; r < req.length; r++) req[r].required = !!on;
    }
  }
  for (var w = 0; w < weiche.length; w++) {
    (function (form) {
      var radios = form.querySelectorAll("input[name=anliegen]");
      for (var r = 0; r < radios.length; r++) radios[r].addEventListener("change", function () { zeigeWeiche(form); });
      zeigeWeiche(form);
    })(weiche[w]);
  }
  var forms = document.querySelectorAll("form[data-demo]");
  for (var f = 0; f < forms.length; f++) {
    (function (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var err = form.querySelector(".error"), tel = form.querySelector("input[type=tel]"), mail = form.querySelector("input[type=email]");
        if (err) err.textContent = "";
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (tel && mail && !tel.value.trim() && !mail.value.trim()) {
          if (err) err.textContent = "Bitte geben Sie eine Telefonnummer oder eine E-Mail-Adresse an, damit die Praxis Sie erreichen kann.";
          tel.focus(); return;
        }
        var ok = document.getElementById(form.getAttribute("data-demo"));
        if (ok) { ok.hidden = false; ok.setAttribute("tabindex", "-1"); ok.focus(); ok.scrollIntoView({ block: "start" }); }
        form.hidden = true;
      });
    })(forms[f]);
  }
})();
