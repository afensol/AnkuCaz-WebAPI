const API_BASE = "http://localhost:5005";

const ANN_LIMIT = 5;
const EVENT_LIMIT = 5;

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ home.js loaded");

  loadHomeAnnouncements();
  loadHomeUpcomingEvents();
});

function formatDateTimeTR(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(d);
}

function formatDateTR(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(d);
}

async function loadHomeAnnouncements() {
  const listEl = document.getElementById("announcementsList");
  if (!listEl) {
    console.warn("❌ announcementsList bulunamadı");
    return;
  }

  try {
    const url = `${API_BASE}/api/Announcements`;
    console.log("➡️ ANN fetch:", url);

    const res = await fetch(url);
    console.log("✅ ANN status:", res.status);

    if (!res.ok) throw new Error("Duyurular alınamadı");

    let data = await res.json();
    console.log("✅ ANN data:", data);


    data = data.map(a => ({
      id: a.id ?? a.announcementId ?? a.AnnouncementId,
      title: a.title ?? a.Title ?? "Duyuru",
      content: a.content ?? a.Content ?? "",
      createdAt: a.createdAt ?? a.createdDate ?? a.CreatedAt ?? a.CreatedDate
    }));

    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    data = data.slice(0, ANN_LIMIT);

    if (data.length === 0) {
      listEl.innerHTML = `<div class="panel-empty">Henüz duyuru yok.</div>`;
      return;
    }

    listEl.innerHTML = data.map(a => `
      <div class="ann-item" onclick="goAnnouncement(${a.id})">
        <div class="ann-title">${escapeHtml(a.title)}</div>
        <div class="ann-meta">${a.createdAt ? formatDateTimeTR(a.createdAt) : ""}</div>
      </div>
    `).join("");

  } catch (err) {
    console.error("❌ ANN error:", err);
    listEl.innerHTML = `<div class="panel-empty">Duyurular yüklenemedi.</div>`;
  }
}

function goAnnouncement(id) {

  window.location.href = `duyuru-detay.html?id=${id}`;
}

async function loadHomeUpcomingEvents() {
  const listEl = document.getElementById("upcomingEventsList");
  if (!listEl) {
    console.warn("❌ upcomingEventsList bulunamadı");
    return;
  }

  try {
    const url = `${API_BASE}/api/Events`;
    console.log("➡️ EVENT fetch:", url);

    const res = await fetch(url);
    console.log("✅ EVENT status:", res.status);

    if (!res.ok) throw new Error("Etkinlikler alınamadı");

    const data = await res.json();
    console.log("✅ EVENT data:", data);

    const now = new Date();

    const upcoming = data
      .filter(e => e.startDate && !isNaN(new Date(e.startDate)))
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, EVENT_LIMIT);

    if (upcoming.length === 0) {
      listEl.innerHTML = `<div class="panel-empty">Yaklaşan etkinlik bulunmuyor.</div>`;
      return;
    }

    listEl.innerHTML = upcoming.map(e => `
      <div class="ev-item" onclick="goEvent(${e.id})">
        <div>
          <div class="ev-title">${escapeHtml(e.title)}</div>
          <div class="ev-meta">${formatDateTR(e.startDate)}</div>
          <div class="ev-meta">${escapeHtml((e.locationName || "") + " • " + (e.locationAddress || ""))}</div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error("❌ EVENT error:", err);
    listEl.innerHTML = `<div class="panel-empty">Etkinlikler yüklenemedi.</div>`;
  }
}


function goEvent(id) {
  window.location.href = `etkinlik_kayıt.html?id=${id}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
