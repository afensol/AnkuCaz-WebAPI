const API_BASE = "http://localhost:5005";

document.addEventListener("DOMContentLoaded", loadAllAnnouncements);

function formatDateTimeTR(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(d);
}

async function loadAllAnnouncements() {
  const listEl = document.getElementById("announcementsPageList");

  try {
    const res = await fetch(`${API_BASE}/api/Announcements`);
    if (!res.ok) throw new Error("Duyurular alınamadı");

    let data = await res.json();
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (data.length === 0) {
      listEl.innerHTML = `<div class="panel-empty">Henüz duyuru yok.</div>`;
      return;
    }

    listEl.innerHTML = data.map(a => `
      <div class="ann-item" onclick="openAnnouncement(${a.id})">
        <div class="ann-title">${escapeHtml(a.title)}</div>
        <div class="ann-meta">${formatDateTimeTR(a.createdAt)}</div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="panel-empty">Duyurular yüklenemedi.</div>`;
  }
}

function openAnnouncement(id) {
  window.location.href = `duyuru-detay.html?id=${id}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
