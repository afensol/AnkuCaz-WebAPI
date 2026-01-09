const API_BASE = "http://localhost:5005";
console.log("ADMIN.JS LOADED v=10", new Date().toISOString());
// =====================
// SESSION STORAGE
// =====================
const LS = {
  type: "ANKUCAZ_SESSION_TYPE", // "admin" | "staff"
  adminKey: "ANKUCAZ_ADMIN_KEY",
  staffKey: "ANKUCAZ_STAFF_KEY",
  staffRole: "ANKUCAZ_STAFF_ROLE",
  staffName: "ANKUCAZ_STAFF_NAME",
};

function setSession(type, key, role = "", name = "") {
  localStorage.setItem(LS.type, type);
  if (type === "admin") {
    localStorage.setItem(LS.adminKey, key || "");
    localStorage.removeItem(LS.staffKey);
    localStorage.removeItem(LS.staffRole);
    localStorage.removeItem(LS.staffName);
  } else if (type === "staff") {
    localStorage.setItem(LS.staffKey, key || "");
    localStorage.setItem(LS.staffRole, role || "");
    localStorage.setItem(LS.staffName, name || "");
    localStorage.removeItem(LS.adminKey);
  }
}

function clearSession() {
  localStorage.removeItem(LS.type);
  localStorage.removeItem(LS.adminKey);
  localStorage.removeItem(LS.staffKey);
  localStorage.removeItem(LS.staffRole);
  localStorage.removeItem(LS.staffName);
}

function getSessionType() {
  return localStorage.getItem(LS.type) || "";
}

function makeHeaders() {
  const h = { "Content-Type": "application/json" };
  const t = getSessionType();
  if (t === "admin") h["X-ADMIN-KEY"] = localStorage.getItem(LS.adminKey) || "";
  if (t === "staff") h["X-STAFF-KEY"] = localStorage.getItem(LS.staffKey) || "";
  return h;
}

// =====================
// HTTP
// =====================
async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const mergedHeaders = {
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("401: Key hatalı veya yok.");
    if (res.status === 403) throw new Error("403: Bu işlem için yetkin yok.");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

// =====================
// UI: PERMISSIONS (sections)
// =====================
function applyPermissions(type, role) {
  const sections = document.querySelectorAll("[data-section]");
  sections.forEach((el) => el.classList.remove("is-visible"));

  if (!type) return;

  const open = (name) =>
    document.querySelectorAll(`[data-section="${name}"]`).forEach((el) => el.classList.add("is-visible"));

  if (type === "admin") {
    open("keys");
    open("events");
    open("announcements");
    open("registrations");
    return;
  }

  const r = (role || "").toLowerCase();
  if (r === "admin" || r === "organizer") {
    open("events");
    open("announcements");
    open("registrations");
  } else {
    open("registrations");
  }
}

function setStatus(msg, ok = true) {
  const el = document.getElementById("keyStatus");
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "" : "salmon";
}

// =====================
// AUTH
// =====================
async function authMe() {
  const res = await api("/api/auth/me", { headers: makeHeaders() });
  return await res.json(); // { type, role, name }
}

async function loginAdmin() {
  const key = (document.getElementById("adminKey")?.value || "").trim();
  if (!key) return setStatus("Admin key gir.", false);

  setSession("admin", key);

  try {
    const me = await authMe();
    applyPermissions(me.type, me.role);
    setStatus("Admin giriş başarılı ✅");
    await bootstrapAfterLogin(me);
  } catch (e) {
    clearSession();
    applyPermissions("", "");
    setStatus(e.message, false);
  }
}

async function loginStaff() {
  const key = (document.getElementById("staffKey")?.value || "").trim();
  if (!key) return setStatus("Staff key gir.", false);

  setSession("staff", key);

  try {
    const me = await authMe();
    localStorage.setItem(LS.staffRole, me.role || "");
    localStorage.setItem(LS.staffName, me.name || "");
    applyPermissions(me.type, me.role);
    setStatus(`Staff giriş ✅ (${me.role || "viewer"})`);
    await bootstrapAfterLogin(me);
  } catch (e) {
    clearSession();
    applyPermissions("", "");
    setStatus(e.message, false);
  }
}

function logout() {
  clearSession();
  applyPermissions("", "");
  setStatus("Çıkış yapıldı.");

  // temizle
  const ids = ["eventsList", "announcementsList", "regsList", "staffKeysList"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });

  const gen = document.getElementById("generatedKey");
  if (gen) gen.value = "";
  const gstat = document.getElementById("generatedKeyStatus");
  if (gstat) gstat.textContent = "";
}

// =====================
// LOADERS
// =====================
let events = [];
let announcements = [];

async function bootstrapAfterLogin(me) {
  if (me.type === "admin") {
    await loadStaffKeys();
  }

  await loadAnnouncements();

  const role = (me.role || "").toLowerCase();
  if (me.type === "admin" || role === "admin" || role === "organizer") {
    await loadEvents();
  } else {
    const list = document.getElementById("eventsList");
    if (list) list.innerHTML = "<p>Viewer rolü: etkinlik yetkisi yok.</p>";
  }
}

// =====================
// STAFF KEY MANAGEMENT
// =====================
async function loadStaffKeys() {
  const list = document.getElementById("staffKeysList");
  if (!list) return;

  list.innerHTML = "Yükleniyor...";

  try {
    const res = await api("/api/admin/keys", { headers: makeHeaders() });
    const keys = await res.json();

    if (!keys.length) {
      list.innerHTML = `<div class="muted">Henüz key yok.</div>`;
      return;
    }

    list.innerHTML = "";
    keys.forEach((k) => {
      const div = document.createElement("div");
      div.className = "event-card";
      div.innerHTML = `
        <h3>${escapeHtml(k.name)} <small style="margin-left:8px;">(${escapeHtml(k.role)})</small></h3>
        <p>
          Durum: <b>${k.isActive ? "Aktif" : "Pasif"}</b> •
          Oluşturma: ${k.createdAt ? new Date(k.createdAt).toLocaleString("tr-TR") : "-"}
        </p>
        <div class="event-actions">
          ${
            k.isActive
              ? `<button class="deactBtn" data-id="${k.id}">Pasifleştir</button>`
              : `<span class="muted">Pasif</span>`
          }
        </div>
      `;
      list.appendChild(div);
    });

    list.querySelectorAll(".deactBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        if (!confirm("Bu key pasifleştirilsin mi?")) return;
        await deactivateStaffKey(id);
        await loadStaffKeys();
      });
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p style="color:red;">${escapeHtml(err.message || "Key listesi alınamadı.")}</p>`;
  }
}

async function createStaffKey() {
  const name = (document.getElementById("staffName")?.value || "").trim();
  const role = document.getElementById("staffRole")?.value || "viewer";
  if (!name) return;

  const genKey = document.getElementById("generatedKey");
  const status = document.getElementById("generatedKeyStatus");
  if (genKey) genKey.value = "";
  if (status) status.textContent = "Üretiliyor...";

  try {
    const res = await api("/api/admin/keys", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({ name, role }),
    });

    const data = await res.json(); // { key: "ank_..." ... } bekleniyor
    const key = data.key || "";

    if (genKey) genKey.value = key;

    // ✅ otomatik kopyala
    if (key) {
      try {
        await navigator.clipboard.writeText(key);
        if (status) status.textContent = "Key üretildi + otomatik kopyalandı ✅";
      } catch {
        if (status) status.textContent = "Key üretildi. Kopyalama izni yok, butonla kopyala.";
      }
    } else {
      if (status) status.textContent = "Key üretildi ama response’da key alanı yok.";
    }

    // input temizle
    const nameInput = document.getElementById("staffName");
    if (nameInput) nameInput.value = "";

    await loadStaffKeys();
  } catch (err) {
    console.error(err);
    if (status) status.textContent = err.message || "Key üretilemedi.";
  }
}

async function deactivateStaffKey(id) {
  await api(`/api/admin/keys/${id}/deactivate`, {
    method: "POST",
    headers: makeHeaders(),
  });
}

async function copyGeneratedKey() {
  const genKey = document.getElementById("generatedKey");
  const status = document.getElementById("generatedKeyStatus");
  const val = (genKey?.value || "").trim();
  if (!val) return;

  try {
    await navigator.clipboard.writeText(val);
    if (status) status.textContent = "Kopyalandı ✅";
  } catch {
    if (status) status.textContent = "Kopyalanamadı.";
  }
}

// =====================
// EVENTS
// =====================
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadEvents() {
  const list = document.getElementById("eventsList");
  if (!list) return;
  list.innerHTML = "Yükleniyor...";

  try {
    const res = await api("/api/admin/events", { headers: makeHeaders() });
    events = await res.json();
    renderEvents();
  } catch (e) {
    console.error(e);
    list.innerHTML = `<p style="color:red">${escapeHtml(e.message)}</p>`;
  }
}

function renderEvents() {
  const list = document.getElementById("eventsList");
  if (!list) return;
  list.innerHTML = "";

  if (!events.length) {
    list.innerHTML = "<p>Etkinlik yok.</p>";
    return;
  }

  events.forEach((ev) => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${escapeHtml(ev.title)}</h3>
      <p><strong>Start:</strong> ${new Date(ev.startDate).toLocaleString("tr-TR")}</p>
      <p><strong>End:</strong> ${new Date(ev.endDate).toLocaleString("tr-TR")}</p>
      <div class="event-actions">
        <button data-id="${ev.id}" class="edit">Düzenle</button>
        <button data-id="${ev.id}" class="delete">Sil</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll(".edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      const ev = events.find((x) => x.id === id);
      if (ev) fillEventForm(ev);
    });
  });

  list.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      if (!confirm("Etkinlik silinsin mi?")) return;
      await deleteEvent(id);
    });
  });
}

function fillEventForm(ev) {
  document.getElementById("eventId").value = ev.id;
  document.getElementById("title").value = ev.title ?? "";
  document.getElementById("description").value = ev.description ?? "";
  document.getElementById("startDate").value = toLocalInputValue(ev.startDate);
  document.getElementById("endDate").value = toLocalInputValue(ev.endDate);
}

function resetEventForm() {
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
  document.getElementById("result").textContent = "";
}

async function onSubmitEvent(e) {
  e.preventDefault();

  const result = document.getElementById("result");
  const id = (document.getElementById("eventId").value || "").trim();

  const body = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    startDate: document.getElementById("startDate").value + ":00",
    endDate: document.getElementById("endDate").value + ":00",
    imageUrl: "",
    categoryId: null,
    venueId: null,
  };

  try {
    if (id) {
      await api(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: makeHeaders(),
        body: JSON.stringify({ ...body, id: parseInt(id, 10) }),
      });
      result.style.color = "green";
      result.textContent = "Güncellendi.";
    } else {
      await api(`/api/admin/events`, {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify(body),
      });
      result.style.color = "green";
      result.textContent = "Eklendi.";
    }

    resetEventForm();
    await loadEvents();
  } catch (err) {
    console.error(err);
    result.style.color = "red";
    result.textContent = err.message || "Hata oluştu.";
  }
}

async function deleteEvent(id) {
  await api(`/api/admin/events/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
  });
  await loadEvents();
}

// =====================
// ANNOUNCEMENTS
// =====================
async function loadAnnouncements() {
  const list = document.getElementById("announcementsList");
  if (!list) return;
  list.innerHTML = "Yükleniyor...";

  try {
    const res = await api("/api/announcements"); // public
    announcements = await res.json();
    renderAnnouncements();
  } catch (e) {
    console.error(e);
    list.innerHTML = `<p style="color:red">${escapeHtml(e.message)}</p>`;
  }
}

function renderAnnouncements() {
  const list = document.getElementById("announcementsList");
  if (!list) return;
  list.innerHTML = "";

  if (!announcements.length) {
    list.innerHTML = "<p>Duyuru yok.</p>";
    return;
  }

  announcements.forEach((a) => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${escapeHtml(a.title)}</h3>
      <p style="white-space:pre-wrap">${escapeHtml(a.content)}</p>
      <p><small>${new Date(a.createdAt).toLocaleString("tr-TR")}</small></p>
      <div class="event-actions">
        <button data-id="${a.id}" class="aEdit">Düzenle</button>
        <button data-id="${a.id}" class="aDelete">Sil</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll(".aEdit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      const a = announcements.find((x) => x.id === id);
      if (a) fillAnnouncementForm(a);
    });
  });

  list.querySelectorAll(".aDelete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id, 10);
      if (!confirm("Bu duyuru silinsin mi?")) return;
      await deleteAnnouncement(id);
      await loadAnnouncements();
    });
  });
}

function fillAnnouncementForm(a) {
  document.getElementById("announcementId").value = a.id;
  document.getElementById("aTitle").value = a.title || "";
  document.getElementById("aContent").value = a.content || "";
  document.getElementById("announcementResult").textContent = "";
}

function resetAnnouncementForm() {
  document.getElementById("announcementId").value = "";
  document.getElementById("aTitle").value = "";
  document.getElementById("aContent").value = "";
  document.getElementById("announcementResult").textContent = "";
}

async function onSubmitAnnouncement(e) {
  e.preventDefault();

  const result = document.getElementById("announcementResult");
  const id = (document.getElementById("announcementId").value || "").trim();

  const body = {
    title: document.getElementById("aTitle").value.trim(),
    content: document.getElementById("aContent").value.trim(),
  };

  try {
    if (id) {
      await api(`/api/announcements/${id}`, {
        method: "PUT",
        headers: makeHeaders(),
        body: JSON.stringify(body),
      });
      result.style.color = "green";
      result.textContent = "Güncellendi.";
    } else {
      await api(`/api/announcements`, {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify(body),
      });
      result.style.color = "green";
      result.textContent = "Eklendi.";
    }

    resetAnnouncementForm();
    await loadAnnouncements();
  } catch (err) {
    console.error(err);
    result.style.color = "red";
    result.textContent = err.message || "Hata oluştu.";
  }
}

async function deleteAnnouncement(id) {
  await api(`/api/announcements/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
  });
}

// =====================
// REGISTRATIONS
// =====================
async function loadRegistrations(eventId) {
  const box = document.getElementById("regsList");
  if (!box) return;
  box.innerHTML = "Yükleniyor...";

  try {
    const res = await api(`/api/admin/registrations/byEvent/${eventId}`, {
      headers: makeHeaders(),
    });
    const regs = await res.json();

    if (!regs.length) {
      box.innerHTML = "<p>Kayıt yok.</p>";
      return;
    }

    box.innerHTML = regs
      .map(
        (r) => `
      <div class="event-card">
        <p><strong>${escapeHtml(r.userFullName)}</strong> — ${escapeHtml(r.userEmail ?? "")}</p>
        <p>Status: ${escapeHtml(r.status)} | ${new Date(r.createdAt).toLocaleString("tr-TR")}</p>
        <button data-id="${r.id}" class="delReg">Kaydı Sil</button>
      </div>
    `
      )
      .join("");

    box.querySelectorAll(".delReg").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id, 10);
        if (!confirm("Kayıt silinsin mi?")) return;
        await deleteRegistration(id);
        await loadRegistrations(eventId);
      });
    });
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p style="color:red">${escapeHtml(e.message)}</p>`;
  }
}

async function deleteRegistration(id) {
  await api(`/api/admin/registrations/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
  });
}

// =====================
// HELPERS
// =====================
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =====================
// WIRE UP
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  // auth butonlar
  document.getElementById("loginAdmin")?.addEventListener("click", loginAdmin);
  document.getElementById("loginStaff")?.addEventListener("click", loginStaff);
  document.getElementById("logout")?.addEventListener("click", logout);

  document.getElementById("createStaffKeyBtn")?.addEventListener("click", async (e) => {
  e.preventDefault(); // Sayfa yenilenmesini engeller
  e.stopPropagation(); // Olayın yukarı dallanmasını engeller
  
  await createStaffKey();
});

  document.getElementById("refreshKeys")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadStaffKeys();
  });
  document.getElementById("copyGeneratedKey")?.addEventListener("click", (e) => {
    e.preventDefault();
    copyGeneratedKey();
  });

  // formlar
  document.getElementById("eventForm")?.addEventListener("submit", onSubmitEvent);
  document.getElementById("resetForm")?.addEventListener("click", resetEventForm);

  document.getElementById("announcementForm")?.addEventListener("submit", onSubmitAnnouncement);
  document.getElementById("resetAnnouncementForm")?.addEventListener("click", resetAnnouncementForm);

  document.getElementById("loadRegs")?.addEventListener("click", () => {
    const eventId = parseInt(document.getElementById("regEventId").value, 10);
    if (!eventId) return;
    loadRegistrations(eventId);
  });

  // inputları doldur
  document.getElementById("adminKey").value = localStorage.getItem(LS.adminKey) || "";
  document.getElementById("staffKey").value = localStorage.getItem(LS.staffKey) || "";

  // sayfa açılınca session var mı?
  const t = getSessionType();
  if (!t) {
    applyPermissions("", "");
    setStatus("Giriş yap.");
    return;
  }

  // session varsa doğrula
  try {
    const me = await authMe();
    applyPermissions(me.type, me.role);
    setStatus(`${me.type === "admin" ? "Admin" : "Staff"} aktif ✅`);
    await bootstrapAfterLogin(me);
  } catch (e) {
    logout();
    setStatus("Oturum doğrulanamadı: " + e.message, false);
  }
});
