const API_BASE = "http://localhost:5005"; 

function el(id) { return document.getElementById(id); }

function setText(id, text) {
  const x = el(id);
  if (x) x.textContent = text;
}


function setVisibleById(id, visible) {
  const x = el(id);
  if (!x) return;


  x.classList.toggle("hide", !visible);
  x.classList.toggle("ap-hide", !visible);


  x.style.display = visible ? "" : "none";
}

function clearHost(id) {
  const host = el(id);
  if (host) host.innerHTML = "";
}

function showMsg(hostId, text, ok = true) {
  const host = el(hostId);
  if (!host) return;

  host.innerHTML = "";
  const box = document.createElement("div");
  box.className = `ap-msg ${ok ? "ok" : "err"}`;
  box.textContent = text;
  host.appendChild(box);
}


async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body,
    credentials: "include" 
  });

  const ct = res.headers.get("content-type") || "";
  let data = null;

  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

function hasRole(roles, r) {
  return Array.isArray(roles) && roles.includes(r);
}


let currentUser = null; 


function setActiveSection(sectionId) {
  document.querySelectorAll(".section, .ap-section").forEach(s => s.classList.remove("active"));
  const sec = el(sectionId);
  if (sec) sec.classList.add("active");
}


function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


init();

async function init() {

  setText("apiBaseText", API_BASE);


  document.querySelectorAll("[data-section]").forEach(btn => {
    btn.addEventListener("click", () => setActiveSection(btn.dataset.section));
  });

  el("btnLogin")?.addEventListener("click", login);
  el("btnLogout")?.addEventListener("click", logout);

  el("btnMe")?.addEventListener("click", async () => {
    try {
      const me = await api("/api/auth/me");
      showMsg("homeMsg", `ME: ${JSON.stringify(me)}`, true);
    } catch (e) {
      showMsg("homeMsg", e.message, false);
    }
  });

  el("btnTestAdmin")?.addEventListener("click", testCreateEvent);

  el("btnCreateUser")?.addEventListener("click", createUser);
  el("btnSetRole")?.addEventListener("click", setRole);

  el("btnLoadRegs")?.addEventListener("click", loadRegs);
  el("btnExportCsv")?.addEventListener("click", exportCsv);


  await bootstrapSession();
}

async function bootstrapSession() {
  try {
    const me = await api("/api/auth/me");
    currentUser = me;
    showApp();
    await fillEventsDropdown(); 
  } catch {
    showLogin();
  }
}


function showLogin() {
  setVisibleById("loginCard", true);
  setVisibleById("appWrap", false);
}

function showApp() {
  setVisibleById("loginCard", false);
  setVisibleById("appWrap", true);


  const email = currentUser?.Email || currentUser?.email || "(unknown)";
  const roles = currentUser?.Roles || currentUser?.roles || [];

  setText("whoamiText", email);


  const badgesHost = el("roleBadges");
  if (badgesHost) {
    badgesHost.innerHTML = "";
    roles.forEach(r => {
      const pill = document.createElement("span");

      pill.className = badgesHost.classList.contains("roleBadges") ? "rolePill" : "ap-badge";
      pill.textContent = r;
      badgesHost.appendChild(pill);
    });
  }

  // Role-based nav
  const isSuper = hasRole(roles, "SuperAdmin");
  const isAdmin = hasRole(roles, "Admin");
  const isViewer = hasRole(roles, "Viewer");


  if (el("navUsers")) el("navUsers").classList.toggle("hide", !isSuper);


  const canSeeRegs = isSuper || isAdmin || isViewer;
  if (el("navRegs")) el("navRegs").classList.toggle("hide", !canSeeRegs);

  const note = el("navNote");
  if (note) {
    note.textContent = isSuper
      ? "SuperAdmin: Üyeler & Roller aktif."
      : "Üyeler & Roller sadece SuperAdmin’e açık.";
  }


  setActiveSection("secHome");
}


async function login() {
  const email = el("loginEmail")?.value?.trim();
  const password = el("loginPass")?.value;

  if (!email || !password) {
    showMsg("loginMsg", "Email ve şifre gir.", false);
    return;
  }

  try {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    currentUser = res; 
    showMsg("loginMsg", "Giriş başarılı.", true);


    showApp();
    await fillEventsDropdown();
  } catch (e) {
    showMsg("loginMsg", e.message, false);
  }
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch { /* ignore */ }

  currentUser = null;
  showLogin();
}


async function testCreateEvent() {

  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const dto = {
    title: "Test Etkinliği",
    locationName: "ANKÜCaz",
    locationAddress: "Ankara",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    description: "admin panel test"
  };

  try {
    const out = await api("/api/events", {
      method: "POST",
      body: JSON.stringify(dto)
    });
    showMsg("homeMsg", `Create Event OK: ${JSON.stringify(out)}`, true);
  } catch (e) {
    showMsg("homeMsg", `Create Event FAIL: ${e.message}`, false);
  }
}


async function createUser() {
  const email = el("newUserEmail")?.value?.trim();
  const password = el("newUserPass")?.value?.trim();

  if (!email || !password) {
    showMsg("createUserMsg", "Email ve şifre gir.", false);
    return;
  }

  try {
    const out = await api("/api/admin/users/create", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    showMsg("createUserMsg", `Kullanıcı oluşturuldu: ${JSON.stringify(out)}`, true);
  } catch (e) {
    showMsg("createUserMsg", e.message, false);
  }
}

async function setRole() {
  const email = el("roleUserEmail")?.value?.trim();
  const role = el("roleSelect")?.value;

  if (!email || !role) {
    showMsg("setRoleMsg", "Email ve rol seç.", false);
    return;
  }

  try {
    const out = await api("/api/admin/users/set-role", {
      method: "POST",
      body: JSON.stringify({ email, role })
    });
    showMsg("setRoleMsg", `Rol atandı: ${JSON.stringify(out)}`, true);
  } catch (e) {
    showMsg("setRoleMsg", e.message, false);
  }
}


async function fillEventsDropdown() {
  const sel = el("regsEventSelect");
  if (!sel) return;

  sel.innerHTML = `<option value="">Etkinlik seç...</option>`;

  try {
    const events = await api("/api/events");
    for (const ev of events) {
      const opt = document.createElement("option");
      opt.value = ev.id;
      const date = (ev.startDate || "").slice(0, 10);
      opt.textContent = `${ev.title}${date ? " — " + date : ""}`;
      sel.appendChild(opt);
    }
  } catch (e) {

    console.warn("fillEventsDropdown:", e.message);
  }
}

function regsMsg(text, ok = true) {
  showMsg("regsMsg", text, ok);
}

async function loadRegs() {
  const eventId = el("regsEventSelect")?.value;
  if (!eventId) {
    regsMsg("Önce etkinlik seç.", false);
    return;
  }

  try {
    const list = await api(`/api/eventregistrations?eventId=${encodeURIComponent(eventId)}`);
    renderRegs(list);
    regsMsg(`Toplam ${list.length} kayıt bulundu.`, true);
  } catch (e) {
    regsMsg(e.message, false);
  }
}

function renderRegs(list) {
  const tbody = el("regsTbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  for (const r of list) {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,.08)";

    const registered = (r.registeredAt || "").replace("T", " ").slice(0, 19);

    tr.innerHTML = `
      <td style="padding:10px 8px;">${escapeHtml(r.fullName)}</td>
      <td style="padding:10px 8px;">${escapeHtml(r.email)}</td>
      <td style="padding:10px 8px;">${escapeHtml(registered)}</td>
      <td style="padding:10px 8px;">
        <button data-del="${r.id}" style="padding:8px 10px;border-radius:12px;">Sil</button>
      </td>
    `;
    tbody.appendChild(tr);
  }


  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!id) return;

      if (!confirm("Bu kaydı silmek istiyor musun?")) return;

      try {
        await api(`/api/eventregistrations/${id}`, { method: "DELETE" });
        regsMsg("Silindi.", true);
        await loadRegs();
      } catch (e) {
        regsMsg(e.message, false);
      }
    });
  });
}

async function exportCsv() {
  const eventId = el("regsEventSelect")?.value;
  if (!eventId) {
    regsMsg("Önce etkinlik seç.", false);
    return;
  }

  try {
    const url = `${API_BASE}/api/eventregistrations/export?eventId=${encodeURIComponent(eventId)}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}: ${t}`);
    }

    const blob = await res.blob();
    const a = document.createElement("a");
    const href = URL.createObjectURL(blob);

    a.href = href;
    a.download = `ankucaz_event_${eventId}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);

    regsMsg("CSV indirildi.", true);
  } catch (e) {
    regsMsg(e.message, false);
  }
}

const EVENTS_API = {
  list: "/api/events",
  create: "/api/events",                
  update: (id) => `/api/events/${id}`,   
  del: (id) => `/api/events/${id}`
};

function eventsMsg(text, ok = true) {
  showMsg("eventMsg", text, ok);
}

el("btnEventsLoad")?.addEventListener("click", loadEvents);
el("btnEventNew")?.addEventListener("click", () => openEventForm());

el("eventForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveEvent();
});

async function loadEvents() {
  const tbody = el("eventsTbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="padding:10px;">Yükleniyor...</td></tr>`;

  try {
    const list = await api(EVENTS_API.list);
    renderEvents(Array.isArray(list) ? list : []);
    eventsMsg(`Toplam ${list.length} etkinlik yüklendi.`, true);


    await fillEventsDropdown();
  } catch (e) {
    eventsMsg(e.message, false);
    tbody.innerHTML = `<tr><td colspan="5" style="padding:10px;">Hata</td></tr>`;
  }
}

function renderEvents(list) {
  const tbody = el("eventsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:10px;">Etkinlik yok.</td></tr>`;
    return;
  }

  for (const ev of list) {
    const date = ev.startDate ? new Date(ev.startDate).toLocaleString() : "-";
    const loc = (ev.locationName || "") + (ev.locationAddress ? ` • ${ev.locationAddress}` : "");

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,.08)";
    tr.innerHTML = `
      <td style="padding:10px 8px;">${escapeHtml(ev.title)}</td>
      <td style="padding:10px 8px;">${escapeHtml(date)}</td>
      <td style="padding:10px 8px;">${escapeHtml(loc || "-")}</td>
      <td style="padding:10px 8px;">${escapeHtml((ev.description || "").slice(0, 40))}${(ev.description||"").length>40 ? "..." : ""}</td>
      <td style="padding:10px 8px; display:flex; gap:8px;">
        <button data-edit="${ev.id}" style="padding:8px 10px;border-radius:12px;">Düzenle</button>
        <button data-del="${ev.id}" style="padding:8px 10px;border-radius:12px;">Sil</button>
      </td>
    `;
    tbody.appendChild(tr);
  }


  tbody.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const ev = await api(`${EVENTS_API.list}/${id}`).catch(() => null); 

      if (!ev) {
        eventsMsg("Detay endpoint yoksa cache ile yapalım. /api/events/{id} var mı?", false);
        return;
      }
      openEventForm(ev);
    });
  });

  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Bu etkinliği silmek istiyor musun?")) return;

      try {
        await api(EVENTS_API.del(id), { method: "DELETE" });
        eventsMsg("Etkinlik silindi.", true);
        await loadEvents();
      } catch (e) {
        eventsMsg(e.message, false);
      }
    });
  });
}


function openEventForm(ev = null) {
  setVisibleById("eventFormCard", true);

  el("eventId").value = ev?.id || "";
  el("eventTitle").value = ev?.title || "";
  el("eventImageUrl").value = ev?.imageUrl || "";
  el("eventDescription").value = ev?.description || "";
  el("eventStart").value = toLocalInputValue(ev?.startDate);
  el("eventEnd").value = toLocalInputValue(ev?.endDate);
  el("eventLocName").value = ev?.locationName || "";
  el("eventLocAddr").value = ev?.locationAddress || "";
}

function closeEventForm() {
  setVisibleById("eventFormCard", false);
  el("eventForm")?.reset();
  el("eventId").value = "";
}

el("btnEventCancel")?.addEventListener("click", closeEventForm);

async function saveEvent() {
  const id = el("eventId").value.trim();

  const dto = {
    title: el("eventTitle").value.trim(),
    imageUrl: el("eventImageUrl").value.trim() || null,
    description: el("eventDescription").value.trim() || null,
    startDate: new Date(el("eventStart").value).toISOString(),
    endDate: el("eventEnd").value ? new Date(el("eventEnd").value).toISOString() : null,
    locationName: el("eventLocName").value.trim() || null,
    locationAddress: el("eventLocAddr").value.trim() || null
  };

  if (!dto.title || !el("eventStart").value) {
    eventsMsg("Başlık ve başlangıç tarihi zorunlu.", false);
    return;
  }

  try {
    if (id) {
      await api(EVENTS_API.update(id), {
        method: "PUT",
        body: JSON.stringify(dto)
      });
      eventsMsg("Etkinlik güncellendi.", true);
    } else {
      await api(EVENTS_API.create, {
        method: "POST",
        body: JSON.stringify(dto)
      });
      eventsMsg("Etkinlik oluşturuldu.", true);
    }

    closeEventForm();
    await loadEvents();
  } catch (e) {
    eventsMsg(e.message, false);
  }
}

const ANNS_API = {
  list: "/api/announcements",
  create: "/api/announcements",
  update: (id) => `/api/announcements/${id}`,
  del: (id) => `/api/announcements/${id}`
};

function annMsg(text, ok = true) {
  showMsg("annMsg", text, ok);
}

el("btnAnnsLoad")?.addEventListener("click", loadAnnouncements);
el("btnAnnNew")?.addEventListener("click", () => openAnnForm());

el("annForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveAnn();
});

async function loadAnnouncements() {
  const tbody = el("annsTbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" style="padding:10px;">Yükleniyor...</td></tr>`;

  try {
    const list = await api(ANNS_API.list);
    renderAnnouncements(Array.isArray(list) ? list : []);
    annMsg(`Toplam ${list.length} duyuru yüklendi.`, true);
  } catch (e) {
    annMsg(e.message, false);
    tbody.innerHTML = `<tr><td colspan="4" style="padding:10px;">Hata</td></tr>`;
  }
}

function renderAnnouncements(list) {
  const tbody = el("annsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:10px;">Duyuru yok.</td></tr>`;
    return;
  }

  for (const a of list) {
    const date = a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "-";

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,.08)";
    tr.innerHTML = `
      <td style="padding:10px 8px;">${escapeHtml(a.title)}</td>
      <td style="padding:10px 8px;">${escapeHtml(date)}</td>
      <td style="padding:10px 8px;">${escapeHtml((a.body || "").slice(0, 40))}${(a.body||"").length>40 ? "..." : ""}</td>
      <td style="padding:10px 8px; display:flex; gap:8px;">
        <button data-edit="${a.id}" style="padding:8px 10px;border-radius:12px;">Düzenle</button>
        <button data-del="${a.id}" style="padding:8px 10px;border-radius:12px;">Sil</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const a = await api(`${ANNS_API.list}/${id}`).catch(() => null);
      if (!a) {
        annMsg("Detay endpoint yoksa cache ile yapalım. /api/announcements/{id} var mı?", false);
        return;
      }
      openAnnForm(a);
    });
  });

  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Bu duyuruyu silmek istiyor musun?")) return;

      try {
        await api(ANNS_API.del(id), { method: "DELETE" });
        annMsg("Duyuru silindi.", true);
        await loadAnnouncements();
      } catch (e) {
        annMsg(e.message, false);
      }
    });
  });
}

function openAnnForm(a = null) {
  setVisibleById("annFormCard", true);

  el("annId").value = a?.id || "";
  el("annTitle").value = a?.title || "";
  el("annBody").value = a?.body || "";
  el("annImageUrl").value = a?.imageUrl || "";
  el("annDate").value = toLocalInputValue(a?.publishedAt);
}

function closeAnnForm() {
  setVisibleById("annFormCard", false);
  el("annForm")?.reset();
  el("annId").value = "";
}

el("btnAnnCancel")?.addEventListener("click", closeAnnForm);

async function saveAnn() {
  const id = el("annId").value.trim();

  const dto = {
    title: el("annTitle").value.trim(),
    body: el("annBody").value.trim() || null,
    imageUrl: el("annImageUrl").value.trim() || null,
    publishedAt: el("annDate").value ? new Date(el("annDate").value).toISOString() : null
  };

  if (!dto.title) {
    annMsg("Başlık zorunlu.", false);
    return;
  }

  try {
    if (id) {
      await api(ANNS_API.update(id), {
        method: "PUT",
        body: JSON.stringify(dto)
      });
      annMsg("Duyuru güncellendi.", true);
    } else {
      await api(ANNS_API.create, {
        method: "POST",
        body: JSON.stringify(dto)
      });
      annMsg("Duyuru oluşturuldu.", true);
    }

    closeAnnForm();
    await loadAnnouncements();
  } catch (e) {
    annMsg(e.message, false);
  }
}

const API = {
  events: {
    list: "/api/Events",
    get: (id) => `/api/Events/${id}`,
    create: "/api/Events",
    update: (id) => `/api/Events/${id}`,
    del: (id) => `/api/Events/${id}`
  },
  anns: {
    list: "/api/Announcements",
    get: (id) => `/api/Announcements/${id}`,
    create: "/api/Announcements",
    update: (id) => `/api/Announcements/${id}`,
    del: (id) => `/api/Announcements/${id}`
  }
};
async function loadEventsAdmin() {
  const tbody = el("eventsTbody");
  tbody.innerHTML = "";

  const list = await api(API.events.list);

  for (const e of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(e.title)}</td>
      <td>${new Date(e.startDate).toLocaleString()}</td>
      <td>${escapeHtml(e.locationName || "")}</td>
      <td>
        <button onclick="editEvent('${e.id}')">✏️</button>
        <button onclick="deleteEvent('${e.id}')">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
async function editEvent(id) {
  const e = await api(API.events.get(id));

  el("eventId").value = e.id;
  el("eventTitle").value = e.title;
  el("eventDescription").value = e.description || "";
  el("eventStart").value = toLocalInputValue(e.startDate);
  el("eventEnd").value = toLocalInputValue(e.endDate);
  el("eventLocName").value = e.locationName || "";
  el("eventLocAddr").value = e.locationAddress || "";

  setVisibleById("eventFormCard", true);
}
async function saveEventAdmin(e) {
  e.preventDefault();

  const id = el("eventId").value;

  const dto = {
    title: el("eventTitle").value,
    description: el("eventDescription").value,
    startDate: new Date(el("eventStart").value).toISOString(),
    endDate: new Date(el("eventEnd").value).toISOString(),
    locationName: el("eventLocName").value,
    locationAddress: el("eventLocAddr").value
  };

  if (id) {
    await api(API.events.update(id), { method: "PUT", body: JSON.stringify(dto) });
  } else {
    await api(API.events.create, { method: "POST", body: JSON.stringify(dto) });
  }

  setVisibleById("eventFormCard", false);
  loadEventsAdmin();
}
async function deleteEvent(id) {
  if (!confirm("Etkinlik silinsin mi?")) return;
  await api(API.events.del(id), { method: "DELETE" });
  loadEventsAdmin();
}
async function loadAnnouncementsAdmin() {
  const tbody = el("annsTbody");
  tbody.innerHTML = "";

  const list = await api(API.anns.list);

  for (const a of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(a.title)}</td>
      <td>${new Date(a.publishedAt || a.createdAt).toLocaleString()}</td>
      <td>
        <button onclick="editAnn('${a.id}')">✏️</button>
        <button onclick="deleteAnn('${a.id}')">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
async function editAnn(id) {
  const a = await api(API.anns.get(id));

  el("annId").value = a.id;
  el("annTitle").value = a.title;
  el("annBody").value = a.body || "";
  el("annDate").value = toLocalInputValue(a.publishedAt);

  setVisibleById("annFormCard", true);
}
async function saveAnnAdmin(e) {
  e.preventDefault();

  const id = el("annId").value;
  const dto = {
    title: el("annTitle").value,
    body: el("annBody").value,
    publishedAt: new Date(el("annDate").value).toISOString()
  };

  if (id) {
    await api(API.anns.update(id), { method: "PUT", body: JSON.stringify(dto) });
  } else {
    await api(API.anns.create, { method: "POST", body: JSON.stringify(dto) });
  }

  setVisibleById("annFormCard", false);
  loadAnnouncementsAdmin();
}
async function deleteAnn(id) {
  if (!confirm("Duyuru silinsin mi?")) return;
  await api(API.anns.del(id), { method: "DELETE" });
  loadAnnouncementsAdmin();
}