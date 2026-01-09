const API_BASE = "http://localhost:5005";

function fmtDateTR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR"); // hem tarih hem saat (istersen sadece date yaparız)
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    document.getElementById("eventDetail").innerHTML = "<p>Etkinlik id bulunamadı.</p>";
    return;
  }

  await loadEventDetail(id);
  setupRegForm(parseInt(id));
});

async function loadEventDetail(id) {
  const box = document.getElementById("eventDetail");
  try {
    const res = await fetch(`${API_BASE}/api/Events/${id}`);
    if (res.status === 404) {
      box.innerHTML = "<p>Etkinlik bulunamadı.</p>";
      return;
    }
    if (!res.ok) throw new Error("Event fetch failed");

    const ev = await res.json();

    box.innerHTML = `
      <h3>${ev.title}</h3>
      <p><strong>Başlangıç:</strong> ${fmtDateTR(ev.startDate)}</p>
      <p><strong>Bitiş:</strong> ${fmtDateTR(ev.endDate)}</p>
      <p><strong>Kategori:</strong> ${ev.categoryId ?? "—"}</p>
      <p><strong>Mekan:</strong> ${ev.venueId ?? "—"}</p>
      <p>${ev.description ?? ""}</p>
    `;
  } catch (e) {
    console.error(e);
    box.innerHTML = "<p>Detay yüklenirken hata oluştu.</p>";
  }
}

function setupRegForm(eventId) {
  const form = document.getElementById("regForm");
  const result = document.getElementById("regResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    result.textContent = "";
    result.style.color = "black";

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/Registrations/byInfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, fullName, email })
      });

      if (res.status === 409) {
        result.style.color = "orange";
        result.textContent = "Zaten bu etkinliğe kayıtlısın.";
        return;
      }

      if (res.status === 404) {
        result.style.color = "red";
        result.textContent = "Etkinlik bulunamadı.";
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        result.style.color = "red";
        result.textContent = "Kayıt başarısız: " + text;
        return;
      }

      const data = await res.json();
      result.style.color = "green";
      result.textContent = `Kayıt başarılı ✅ (${data.userFullName} - ${data.email})`;
      form.reset();
    } catch (err) {
      console.error(err);
      result.style.color = "red";
      result.textContent = "Bir hata oluştu. API çalışıyor mu kontrol et.";
    }
  });
}
