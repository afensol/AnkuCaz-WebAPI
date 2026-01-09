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

    // alan adı toleransı (createdAt / createdDate vs)
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
  // Sende detay sayfan: duyuru-detay.html
  window.location.href = `duyuru-detay.html?id=${id}`;
}

async function loadHomeUpcomingEvents() {
  const listEl = document.getElementById("upcomingEventsList");
  if (!listEl) {
    console.warn("❌ upcomingEventsList bulunamadı");
    return;
  }

  try {
    const url = `${API_BASE}/api/admin/events`;
    console.log("➡️ EVENT fetch:", url);

    const res = await fetch(url);
    console.log("✅ EVENT status:", res.status);

    if (!res.ok) throw new Error("Etkinlikler alınamadı");

    const dataRaw = await res.json();
    console.log("✅ EVENT raw:", dataRaw);

    const mapped = dataRaw.map(e => {
      const id = e.id ?? e.eventId ?? e.EventId;

      const name =
        e.name ?? e.title ?? e.eventName ?? e.EventName ?? "Etkinlik";

      const dateStr =
        e.eventDate ?? e.date ?? e.startDate ?? e.eventTime ?? e.EventDate ?? e.StartDate;

      const image =
        e.imageUrl ?? e.image ?? e.photoUrl ?? e.coverImageUrl ?? e.ImageUrl ?? "";

      return { id, name, eventDate: dateStr, imageUrl: image };
    });

    console.log("✅ EVENT mapped:", mapped);

    const now = new Date();

    const upcoming = mapped
      .filter(e => e.eventDate && !isNaN(new Date(e.eventDate)))
      .filter(e => new Date(e.eventDate) >= now)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, EVENT_LIMIT);

    if (upcoming.length === 0) {
      listEl.innerHTML = `<div class="panel-empty">Yaklaşan etkinlik bulunmuyor.</div>`;
      return;
    }

    listEl.innerHTML = upcoming.map(e => `
      <div class="ev-item" onclick="goEvent(${e.id})">
        <img class="ev-thumb" src="${e.imageUrl || "images/placeholder.jpg"}" alt="Etkinlik">
        <div>
          <div class="ev-title">${escapeHtml(e.name)}</div>
          <div class="ev-meta">${formatDateTR(e.eventDate)}</div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error("❌ EVENT error:", err);
    listEl.innerHTML = `<div class="panel-empty">Etkinlikler yüklenemedi.</div>`;
  }
}

function goEvent(id) {
  // Sende detay sayfan event.html görünüyor
  window.location.href = `event.html?id=${id}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
