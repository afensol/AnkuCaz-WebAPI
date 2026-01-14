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
  const descEl = $("description"); 

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


    if (titleEl) titleEl.innerText = ev.title ?? "Etkinlik";


    const locationText = [ev.locationName, ev.locationAddress].filter(Boolean).join(" — ");
    if (locEl) locEl.innerText = locationText || "—";


    if (startEl) startEl.innerText = fmt(ev.startDate);
    if (endEl) endEl.innerText = fmt(ev.endDate);

   
    if (subEl) subEl.innerText = `${fmt(ev.startDate)} • ${ev.locationName ?? "Konum"}`;


    if (mapEl) {
      const q = [ev.locationName, ev.locationAddress].filter(Boolean).join(" ");
      mapEl.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }


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
async function register() {
  const fullName = ($("fullName")?.value || "").trim();
  const email = ($("email")?.value || "").trim();

  const msgEl = $("msg");
  const setMsg = (text, ok) => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = ok ? "green" : "crimson";
  };

  if (!eventId) return setMsg("Etkinlik id bulunamadı.", false);
  if (!fullName) return setMsg("Ad Soyad zorunlu.", false);
  if (!email) return setMsg("E-posta zorunlu.", false);

  try {
    const res = await fetch(`${API_BASE}/api/EventRegistrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: Number(eventId), fullName, email })
    });

    if (res.status === 409) {
      const t = await res.text().catch(() => "");
      return setMsg(t || "Bu e-posta bu etkinliğe zaten kayıtlı.", false);
    }

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return setMsg(`Hata: ${res.status} ${res.statusText} ${t}`, false);
    }

    setMsg("✅ Kayıt alındı!", true);
    if ($("fullName")) $("fullName").value = "";
    if ($("email")) $("email").value = "";
  } catch (e) {
    console.error(e);
    setMsg("API’ye bağlanılamadı.", false);
  }
}


window.register = register;

