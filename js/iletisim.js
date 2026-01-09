document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5005";

  const form = document.getElementById("contactForm");
  const result = document.getElementById("contactResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      result.textContent = "Lütfen tüm alanları doldurun.";
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/ContactMessages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email: email,
          message: message
        })
      });

      if (response.ok) {
        result.textContent = "Mesajınız başarıyla iletildi, teşekkürler!";
        form.reset();
      } else {
        const errText = await response.text();
        result.textContent = "Mesaj gönderilirken bir hata oluştu.";
        console.error("POST hata:", response.status, errText);
      }
    } catch (err) {
      console.error("Bağlantı hatası:", err);
      result.textContent = "Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";
    }
  });
});
