// announcement-detail.js
// 🔥 Senin API launchSettings’inde HTTP portu 5005
const API_BASE = "http://localhost:5005";

document.addEventListener("DOMContentLoaded", loadAnnouncementDetail);

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function formatDateTimeTR(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(d);
}

async function loadAnnouncementDetail() {
  const card = document.getElementById("announcementDetailCard");
  const titleEl = document.getElementById("announcementTitle");
  const id = getQueryParam("id");

  if (!id) {
    titleEl.textContent = "Duyuru bulunamadı";
    card.innerHTML = `<div class="panel-empty">Geçersiz duyuru id.</div>`;
    return;
  }

  try {
    // Controller route'u: /api/Announcements/{id}
    const res = await fetch(`${API_BASE}/api/Announcements/${id}`);
    if (!res.ok) throw new Error("Duyuru detayı alınamadı");

    const a = await res.json();

    // 🔥 Üstte H1 başlığı duyurunun başlığı olacak
    titleEl.textContent = a.title || "Duyuru";

    // 🔥 Kartın içinde sadece meta + ana metin olacak
    card.innerHTML = `
      <div class="ann-meta" style="margin-bottom:12px; opacity:.8;">
        ${a.createdAt ? formatDateTimeTR(a.createdAt) : ""}
      </div>
      <div style="color:#ddd; line-height:1.7; white-space: pre-wrap;">
        ${escapeHtml(a.content)}
      </div>
    `;

  } catch (err) {
    console.error(err);
    titleEl.textContent = "Hata";
    card.innerHTML = `<div class="panel-empty">Duyuru detayı yüklenemedi.</div>`;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
