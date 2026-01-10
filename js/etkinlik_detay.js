const API_BASE = "http://localhost:5005";
const params = new URLSearchParams(location.search);
const eventId = params.get("id");

const $ = (id) => document.getElementById(id);

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

async function loadEvent() {
  const titleEl = $("title");
  const subEl = $("subtitle");
  const locEl = $("location");
  const startEl = $("start");
  const endEl = $("end");
  const mapEl = $("map");
  const descEl = $("description"); // ✅ HTML'de olmalı

  if (!eventId) {
    if (titleEl) titleEl.innerText = "Etkinlik bulunamadı";
    if (subEl) subEl.innerText = "URL’de id parametresi yok.";
    return;
  }

  try {
    if (subEl) subEl.innerText = "Detaylar yükleniyor...";

    const res = await fetch(`${API_BASE}/api/Events/${eventId}`);
    if (!res.ok) {
      if (titleEl) titleEl.innerText = "Etkinlik bulunamadı";
      if (subEl) subEl.innerText = `API hata: ${res.status}`;
      return;
    }

    const ev = await res.json();

    // ✅ Başlık
    if (titleEl) titleEl.innerText = ev.title ?? "Etkinlik";

    // ✅ Mekan metni
    const locationText = [ev.locationName, ev.locationAddress].filter(Boolean).join(" — ");
    if (locEl) locEl.innerText = locationText || "—";

    // ✅ Tarihler
    if (startEl) startEl.innerText = fmt(ev.startDate);
    if (endEl) endEl.innerText = fmt(ev.endDate);

    // ✅ Subtitle: yükleniyor yazısını kaldır (net ve bilgilendirici kalsın)
    if (subEl) subEl.innerText = `${fmt(ev.startDate)} • ${ev.locationName ?? "Konum"}`;

    // ✅ Harita
    if (mapEl) {
      const q = [ev.locationName, ev.locationAddress].filter(Boolean).join(" ");
      mapEl.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }

    // ✅ Description
    if (descEl) {
      const desc = (ev.description ?? "").trim();
      descEl.innerText = desc || "Bu etkinlik için açıklama eklenmemiş.";
    } else {
      console.warn("HTML'de id='description' bulunamadı. Açıklama gösterilemez.");
    }

  } catch (err) {
    console.error(err);
    if (titleEl) titleEl.innerText = "Etkinlik yüklenemedi";
    if (subEl) subEl.innerText = "API’ye bağlanılamadı (API kapalı / CORS / URL hatası).";
  }
}

loadEvent();
