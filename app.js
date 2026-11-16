/* =========================================================
   Brow Atelier · demo
   JS compartido por index.html y academia.html
   ========================================================= */

/* ---------- WhatsApp ---------- */
const WA_NUMBER = "50660571805";
const WA_MSG = {
  cita: "Hola, me gustaría agendar una cita en Brow Atelier.",
  nb: "Hola, me gustaría agendar una cita para Naturale Brows.",
  rem: "Hola, me gustaría agendar una cita de despigmentación de cejas.",
  academy: "Hola, me gustaría recibir información sobre el curso Método Naturale Brows."
};
const waLink = text => "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
document.querySelectorAll("[data-wa]").forEach(a => {
  a.href = waLink(WA_MSG[a.dataset.wa] || WA_MSG.cita);
  a.target = "_blank"; a.rel = "noopener";
});

/* ---------- Agenda (simulada) ----------
   Cada servicio usa el calendario de su especialista.
   Cambia horarios, días y servicios aquí. */
const BOOKING = {
  demo: true,                 // muestra la etiqueta "Modo demo" y no envía nada
  weeksAhead: 8,              // cuántas semanas se pueden reservar
  calendars: {
    nicole:  { label: "Agenda de Nicole", days: [2,3,4,5,6], start: "09:00", end: "17:00", step: 60, breaks: [["12:00","13:00"]], busy: .45 },
    luis:    { label: "Agenda de Luis",   days: [2,3,4,5,6], start: "10:00", end: "18:00", step: 30, breaks: [["13:00","14:00"]], busy: .4 },
    academy: { label: "Llamadas Academy", days: [2,4,6],     start: "16:00", end: "19:00", step: 30, breaks: [], busy: .35 }
  },
  services: {
    nb:      { name: "Naturale Brows", group: "Naturale Brows", desc: "Nanoblading pelo a pelo", price: "₡155.000", duration: 60, durationLabel: "60 min aprox.", specialist: "Nicole Torres", calendar: "nicole", place: "Avalon Plaza, Local B05, Santa Ana" },
    retoque: { name: "Retoque Naturale Brows", group: "Naturale Brows", desc: "Para clientas de Naturale Brows", price: "₡55.000", duration: 60, specialist: "Nicole Torres", calendar: "nicole", place: "Avalon Plaza, Local B05, Santa Ana" },
    refresh: { name: "Refrescamiento Naturale Brows", group: "Naturale Brows", desc: "Retoque antes de 2 años", price: "₡100.000", duration: 60, specialist: "Nicole Torres", calendar: "nicole", place: "Avalon Plaza, Local B05, Santa Ana" },
    rem:     { name: "Despigmentación de cejas", group: "Remoción de pigmento", desc: "Remoción con láser · incluye anestesia tópica", price: "₡75.000 por sesión", duration: 30, durationLabel: "30 min aprox.", specialist: "Luis Duarte", calendar: "luis", place: "Avalon Plaza, Local B05, Santa Ana" },
    academy: { name: "Llamada informativa", group: "Academy", desc: "Método Naturale Brows · inversión y detalles del curso", price: "Sin costo", duration: 30, durationLabel: "Llamada personal", specialist: "Nicole Torres", calendar: "academy", place: "Llamada por WhatsApp", academyOnly: true }
  }
};

const Booking = (() => {
  const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const DAYS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const booked = new Set();           // reservas hechas en esta visita
  let state = {}, root, lastFocus;

  const pad = n => String(n).padStart(2, "0");
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmtTime = min => { let h = Math.floor(min / 60), m = min % 60; const ap = h >= 12 ? "p. m." : "a. m."; h = h % 12 || 12; return h + ":" + pad(m) + " " + ap; };
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const longDate = d => DAYS[d.getDay()] + " " + d.getDate() + " de " + MONTHS[d.getMonth()];
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  // número pseudoaleatorio estable para simular ocupación
  const rand = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

  function slotsFor(svcKey, date) {
    const svc = BOOKING.services[svcKey], cal = BOOKING.calendars[svc.calendar];
    if (!cal.days.includes(date.getDay())) return null;
    const t0 = today(), max = new Date(t0); max.setDate(max.getDate() + BOOKING.weeksAhead * 7);
    if (date < t0 || date > max) return null;
    const key = svc.calendar + ymd(date);
    const dayFull = rand(key + "full") < .12;
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = ymd(date) === ymd(now);
    const out = [];
    for (let m = toMin(cal.start); m + svc.duration <= toMin(cal.end); m += cal.step) {
      const inBreak = cal.breaks.some(([a, b]) => m < toMin(b) && m + svc.duration > toMin(a));
      if (inBreak) continue;
      const taken = dayFull || rand(key + m) < cal.busy || booked.has(svc.calendar + ymd(date) + m) || (isToday && m < nowMin + 120);
      out.push({ min: m, taken });
    }
    return out;
  }
  const hasFree = (svcKey, date) => { const s = slotsFor(svcKey, date); return s ? s.some(x => !x.taken) : null; };

  function build() {
    root = document.createElement("div");
    root.className = "bk";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="bk-bg" data-bk-close></div>
      <div class="bk-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-title">
        <aside class="bk-side">
          <img class="bk-logo" src="https://browateliercr.com/images/logo-brow-atelier-negro.png" alt="Brow Atelier">
          <p class="bk-eyebrow">Reserva en línea</p>
          <div class="bk-summary"></div>
          ${BOOKING.demo ? '<span class="bk-demo">Modo demo</span>' : ""}
        </aside>
        <div class="bk-main">
          <div class="bk-top">
            <button class="bk-back" type="button" aria-label="Volver"><svg><use href="#i-arrow"/></svg></button>
            <div class="bk-steps" aria-hidden="true"><span></span><span></span><span></span></div>
            <button class="bk-close" type="button" aria-label="Cerrar" data-bk-close><svg><use href="#i-x"/></svg></button>
          </div>
          <div class="bk-body"></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.addEventListener("click", e => { if (e.target.closest("[data-bk-close]")) close(); });
    root.querySelector(".bk-back").addEventListener("click", back);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("open")) close(); });
  }

  function open(svcKey) {
    if (!root) build();
    lastFocus = document.activeElement;
    const svc = BOOKING.services[svcKey] ? svcKey : null;
    const first = svc && hasFirstFree(svc);
    state = { svc, fixed: !!svc, step: svc ? "date" : "service", view: first ? new Date(first.getFullYear(), first.getMonth(), 1) : new Date(today().getFullYear(), today().getMonth(), 1), date: null, slot: null, data: {} };
    render();
    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => root.querySelector(".bk-close").focus(), 50);
  }
  function close() {
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  function hasFirstFree(svcKey) {
    const d = today();
    for (let i = 0; i < BOOKING.weeksAhead * 7; i++) { if (hasFree(svcKey, d)) return new Date(d); d.setDate(d.getDate() + 1); }
    return null;
  }
  function back() {
    if (state.step === "details") state.step = "date";
    else if (state.step === "date" && !state.fixed) { state.step = "service"; state.date = null; state.slot = null; }
    render();
  }

  function renderSummary() {
    const s = state.svc && BOOKING.services[state.svc];
    const box = root.querySelector(".bk-summary");
    if (!s) { box.innerHTML = `<h2 class="bk-side-title">Elija su servicio</h2><p class="bk-muted">Atendemos de martes a sábado, únicamente con cita previa.</p>`; return; }
    box.innerHTML = `
      <h2 class="bk-side-title">${s.name}</h2>
      <p class="bk-muted">${s.desc}</p>
      <ul class="bk-facts">
        <li><svg><use href="#i-user"/></svg>${s.specialist}</li>
        ${s.durationLabel ? `<li><svg><use href="#i-clock"/></svg>${s.durationLabel}</li>` : ""}
        <li><svg><use href="#i-pin"/></svg>${s.place}</li>
        ${state.date ? `<li class="bk-hl"><svg><use href="#i-cal"/></svg><span>${cap(longDate(state.date))}${state.slot != null ? " · " + fmtTime(state.slot) : ""}</span></li>` : ""}
      </ul>
      <p class="bk-price">${s.price}</p>`;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function render() {
    renderSummary();
    const body = root.querySelector(".bk-body");
    const idx = { service: 0, date: state.fixed ? 0 : 1, details: state.fixed ? 1 : 2, done: 3 }[state.step];
    root.querySelectorAll(".bk-steps span").forEach((s, i) => s.classList.toggle("on", i <= idx));
    root.querySelector(".bk-steps").style.visibility = state.step === "done" ? "hidden" : "visible";
    root.querySelector(".bk-back").style.visibility = (state.step === "details" || (state.step === "date" && !state.fixed)) ? "visible" : "hidden";
    body.classList.remove("bk-fade"); void body.offsetWidth; body.classList.add("bk-fade");
    ({ service: renderService, date: renderDate, details: renderDetails, done: renderDone })[state.step](body);
    body.scrollTop = 0;
  }

  function renderService(body) {
    const groups = {};
    Object.entries(BOOKING.services).forEach(([k, s]) => {
      if (s.academyOnly && !document.body.classList.contains("page-academia")) return;
      (groups[s.group] = groups[s.group] || []).push([k, s]);
    });
    body.innerHTML = `<h3 class="bk-title" id="bk-title">¿Qué servicio desea reservar?</h3>` +
      Object.entries(groups).map(([g, items]) => `
        <p class="bk-group">${g}</p>
        <div class="bk-services">${items.map(([k, s]) => `
          <button type="button" class="bk-service" data-svc="${k}">
            <span><strong>${s.name}</strong><small>${s.desc} · ${s.specialist}</small></span>
            <span class="bk-service-price">${s.price}</span>
          </button>`).join("")}
        </div>`).join("");
    body.querySelectorAll(".bk-service").forEach(b => b.addEventListener("click", () => {
      state.svc = b.dataset.svc; state.step = "date";
      const f = hasFirstFree(state.svc); if (f) state.view = new Date(f.getFullYear(), f.getMonth(), 1);
      render();
    }));
  }

  function renderDate(body) {
    const s = BOOKING.services[state.svc], cal = BOOKING.calendars[s.calendar];
    const v = state.view, y = v.getFullYear(), mo = v.getMonth();
    const firstDow = (new Date(y, mo, 1).getDay() + 6) % 7;     // lunes = 0
    const daysIn = new Date(y, mo + 1, 0).getDate();
    const t0 = today();
    const minView = new Date(t0.getFullYear(), t0.getMonth(), 1);
    const maxD = new Date(t0); maxD.setDate(maxD.getDate() + BOOKING.weeksAhead * 7);
    const maxView = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += `<span></span>`;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(y, mo, d), free = hasFree(state.svc, date);
      const sel = state.date && ymd(state.date) === ymd(date);
      const cls = free === null ? "off" : free ? "free" : "full";
      cells += `<button type="button" class="bk-day ${cls}${sel ? " sel" : ""}${ymd(date) === ymd(t0) ? " today" : ""}" data-d="${d}" ${free ? "" : "disabled"} aria-label="${longDate(date)}${free === false ? ", sin espacios" : ""}">${d}</button>`;
    }
    let slotsHtml = `<p class="bk-hint">Seleccione un día disponible para ver los horarios.</p>`;
    if (state.date) {
      const sl = slotsFor(state.svc, state.date) || [];
      const am = sl.filter(x => x.min < 720), pm = sl.filter(x => x.min >= 720);
      const grp = (label, arr) => arr.length ? `<p class="bk-group">${label}</p><div class="bk-slots">${arr.map(x => `<button type="button" class="bk-slot${state.slot === x.min ? " sel" : ""}" data-m="${x.min}" ${x.taken ? "disabled" : ""}>${fmtTime(x.min)}</button>`).join("")}</div>` : "";
      slotsHtml = `<p class="bk-day-label">${cap(longDate(state.date))}</p>` + grp("Mañana", am) + grp("Tarde", pm);
    }
    body.innerHTML = `
      <h3 class="bk-title" id="bk-title">Elija fecha y hora</h3>
      <p class="bk-sub">${cal.label} · ${s.specialist}</p>
      <div class="bk-cal-wrap">
        <div class="bk-cal">
          <div class="bk-cal-head">
            <button type="button" class="bk-nav prev" aria-label="Mes anterior" ${v <= minView ? "disabled" : ""}><svg><use href="#i-arrow"/></svg></button>
            <p>${cap(MONTHS[mo])} ${y}</p>
            <button type="button" class="bk-nav next" aria-label="Mes siguiente" ${v >= maxView ? "disabled" : ""}><svg><use href="#i-arrow"/></svg></button>
          </div>
          <div class="bk-dow"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
          <div class="bk-grid">${cells}</div>
          <div class="bk-legend"><span><i class="free"></i>Disponible</span><span><i class="full"></i>Sin espacios</span></div>
        </div>
        <div class="bk-times">${slotsHtml}</div>
      </div>
      <div class="bk-actions"><button type="button" class="btn btn-dark bk-next" ${state.slot == null ? "disabled" : ""}>Continuar</button></div>`;
    body.querySelector(".prev").addEventListener("click", () => { state.view = new Date(y, mo - 1, 1); render(); });
    body.querySelector(".next").addEventListener("click", () => { state.view = new Date(y, mo + 1, 1); render(); });
    body.querySelectorAll(".bk-day.free").forEach(b => b.addEventListener("click", () => { state.date = new Date(y, mo, +b.dataset.d); state.slot = null; render(); if (innerWidth < 768) setTimeout(() => body.querySelector(".bk-times").scrollIntoView({ behavior: "smooth", block: "start" }), 60); }));
    body.querySelectorAll(".bk-slot:not([disabled])").forEach(b => b.addEventListener("click", () => { state.slot = +b.dataset.m; render(); if (innerWidth < 768) setTimeout(() => body.querySelector(".bk-actions").scrollIntoView({ behavior: "smooth", block: "end" }), 60); }));
    body.querySelector(".bk-next").addEventListener("click", () => { state.step = "details"; render(); });
  }

  function renderDetails(body) {
    const d = state.data, isRem = state.svc === "rem", isAc = state.svc === "academy";
    body.innerHTML = `
      <h3 class="bk-title" id="bk-title">Sus datos</h3>
      <p class="bk-sub">Le confirmamos la cita por WhatsApp.</p>
      <form class="bk-form" novalidate>
        <label>Nombre completo<input name="name" autocomplete="name" required value="${esc(d.name)}"></label>
        <label>WhatsApp<div class="bk-phone"><span>+506</span><input name="phone" inputmode="tel" autocomplete="tel-national" placeholder="8888 8888" required value="${esc(d.phone)}"></div></label>
        <label>Correo <em>(opcional)</em><input name="email" type="email" autocomplete="email" value="${esc(d.email)}"></label>
        ${isRem ? `<fieldset><legend>¿Qué trabajo tiene actualmente?</legend>
          <div class="bk-chips">${["Microblading","Micropigmentación sombreada","Tatuaje de cejas","No estoy segura"].map(o => `<label class="bk-chip"><input type="radio" name="prev" value="${o}" ${d.prev === o ? "checked" : ""}><span>${o}</span></label>`).join("")}</div></fieldset>` : ""}
        ${isAc ? `<fieldset><legend>¿Cuál es su experiencia?</legend>
          <div class="bk-chips">${["Empiezo desde cero","Ya soy micropigmentadora","Quiero hacer crecer mi negocio"].map(o => `<label class="bk-chip"><input type="radio" name="prev" value="${o}" ${d.prev === o ? "checked" : ""}><span>${o}</span></label>`).join("")}</div></fieldset>` : ""}
        <label>Comentarios <em>(opcional)</em><textarea name="notes" rows="3">${esc(d.notes)}</textarea></label>
        <p class="bk-error" hidden>Complete su nombre y un número de WhatsApp válido.</p>
        <div class="bk-actions"><button class="btn btn-dark" type="submit">Confirmar reserva</button></div>
      </form>`;
    const form = body.querySelector("form");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      state.data = f;
      const okPhone = (f.phone || "").replace(/\D/g, "").length >= 8;
      if (!f.name.trim() || !okPhone) { form.querySelector(".bk-error").hidden = false; return; }
      booked.add(BOOKING.services[state.svc].calendar + ymd(state.date) + state.slot);
      state.step = "done"; render();
    });
  }
  const esc = v => (v || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderDone(body) {
    const s = BOOKING.services[state.svc], d = state.date;
    const start = new Date(d); start.setMinutes(state.slot);
    const end = new Date(start.getTime() + s.duration * 60000);
    const g = x => x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + "T" + pad(x.getHours()) + pad(x.getMinutes()) + "00";
    const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(s.name + " · Brow Atelier") +
      "&dates=" + g(start) + "/" + g(end) + "&ctz=America/Costa_Rica&location=" + encodeURIComponent(s.place + ", Costa Rica") +
      "&details=" + encodeURIComponent("Especialista: " + s.specialist + "\nWhatsApp: +506 6057 1805");
    const when = cap(longDate(d)) + " a las " + fmtTime(state.slot);
    const msg = "Hola, acabo de reservar en línea:\n" + s.name + "\n" + when + "\nNombre: " + state.data.name + (state.data.prev ? "\n" + state.data.prev : "");
    const first = state.data.name.trim().split(" ")[0];
    body.innerHTML = `
      <div class="bk-done">
        <div class="bk-check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
        <h3 class="bk-title" id="bk-title">${s.calendar === "academy" ? "Llamada agendada" : "Cita reservada"}</h3>
        <p class="bk-sub">Gracias, ${esc(first)}. ${s.calendar === "academy" ? "Nicole le llamará por WhatsApp a la hora acordada." : "Le esperamos en el estudio."}</p>
        <dl class="bk-receipt">
          <div><dt>Servicio</dt><dd>${s.name}</dd></div>
          <div><dt>Fecha</dt><dd>${cap(longDate(d))}</dd></div>
          <div><dt>Hora</dt><dd>${fmtTime(state.slot)}</dd></div>
          <div><dt>Especialista</dt><dd>${s.specialist}</dd></div>
          <div><dt>Lugar</dt><dd>${s.place}</dd></div>
          <div><dt>Inversión</dt><dd>${s.price}</dd></div>
        </dl>
        <div class="bk-done-actions">
          <a class="btn btn-dark" href="${waLink(msg)}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Confirmar por WhatsApp</a>
          <a class="btn btn-outline" href="${gcal}" target="_blank" rel="noopener"><svg><use href="#i-cal"/></svg>Agregar a mi calendario</a>
        </div>
        ${BOOKING.demo ? `<p class="bk-demo-note">Demo: esta reserva es una simulación y no se envía a ningún sistema.</p>` : ""}
      </div>`;
  }

  return { open, close };
})();

document.addEventListener("click", e => {
  const t = e.target.closest("[data-book]");
  if (!t) return;
  e.preventDefault();
  Booking.open(t.dataset.book);
});
document.querySelectorAll("li[data-book]").forEach(li => li.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); Booking.open(li.dataset.book); }
}));

/* ---------- Aparición al hacer scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
}, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- FAQ ---------- */
document.querySelectorAll(".faq-item button").forEach(btn => {
  btn.addEventListener("click", () => {
    const open = btn.closest(".faq-item").classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
});

/* ---------- Menú móvil ---------- */
const sheet = document.getElementById("sheet");
if (sheet) {
  const setMenu = open => {
    sheet.classList.toggle("open", open);
    sheet.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  document.querySelector("[data-menu-open]").addEventListener("click", () => setMenu(true));
  sheet.querySelectorAll("[data-menu-close]").forEach(el => el.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheet.classList.contains("open")) setMenu(false); });
}

/* ---------- Testimonios: mostrar 6 y expandir ---------- */
const quotes = document.querySelector(".quotes");
const moreBtn = document.getElementById("more-quotes");
if (quotes && moreBtn) {
  const total = quotes.querySelectorAll("li").length;
  quotes.querySelectorAll("li").forEach((li, i) => { if (i >= 6) li.classList.add("extra"); });
  moreBtn.textContent = "Ver todos los testimonios (" + total + ")";
  moreBtn.addEventListener("click", () => {
    const all = quotes.classList.toggle("show-all");
    moreBtn.textContent = all ? "Ver menos" : "Ver todos los testimonios (" + total + ")";
    moreBtn.setAttribute("aria-expanded", all);
    quotes.querySelectorAll("li.extra").forEach(li => li.classList.add("is-visible"));
    if (!all) document.getElementById("testimonios").scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- Scroll: header, barra móvil, volver arriba, progreso ---------- */
const header = document.querySelector("header");
const bar = document.getElementById("mobile-bar");
const toTop = document.getElementById("to-top");
const progress = document.getElementById("progress");
const stopBar = document.querySelector("[data-hide-bar]");
const onScroll = () => {
  const y = scrollY;
  header.classList.toggle("scrolled", y > 20);
  if (bar) {
    const near = stopBar && stopBar.getBoundingClientRect().top < innerHeight * .6;
    bar.classList.toggle("show", y > innerHeight * .7 && !near);
  }
  if (toTop) toTop.classList.toggle("show", y > innerHeight * 1.5);
  if (progress) {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  }
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();
if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Lightbox de galerías ---------- */
const lb = document.getElementById("lightbox");
const zoomImgs = [...document.querySelectorAll(".gallery img, .studio img")];
if (lb && zoomImgs.length) {
  const lbImg = lb.querySelector("img"), lbCap = lb.querySelector("p");
  let lbIndex = 0;
  const showLb = i => {
    lbIndex = (i + zoomImgs.length) % zoomImgs.length;
    const img = zoomImgs[lbIndex];
    lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt;
  };
  zoomImgs.forEach((img, i) => {
    img.setAttribute("data-zoom", "");
    img.addEventListener("click", () => { showLb(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; });
  });
  const closeLb = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
  lb.querySelector(".lb-close").addEventListener("click", closeLb);
  lb.querySelector(".lb-prev").addEventListener("click", e => { e.stopPropagation(); showLb(lbIndex - 1); });
  lb.querySelector(".lb-next").addEventListener("click", e => { e.stopPropagation(); showLb(lbIndex + 1); });
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  });
}
