const API_BASE = "http://localhost:5005"; 

let events = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  setupForm();
  setupCalendarNav();
});

async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE}/api/Events`);
    if (!response.ok) throw new Error("Etkinlikler alınamadı");

    events = await response.json();
    renderEventsList();
    renderCalendar();
  } catch (err) {
    console.error(err);
    const container = document.getElementById("events-container");
    container.innerHTML = "<p>Etkinlikler yüklenirken hata oluştu.</p>";
  }
}


function renderEventsList(filterDate = null) {
  const container = document.getElementById("events-container");
  container.innerHTML = "";

  let filtered = events;

  if (filterDate) {
    filtered = events.filter(ev => ev.date === filterDate);
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = "<p>Bu tarihte etkinlik bulunmuyor.</p>";
    return;
  }

  filtered.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${ev.title}</h3>
      <p><strong>Tarih:</strong> ${ev.date}</p>
      <p><strong>Mekan:</strong> ${ev.location}</p>
      <p>${ev.description}</p>
      <div class="event-actions">
        <button data-id="${ev.id}" class="edit-btn">Düzenle</button>
        <button data-id="${ev.id}" class="delete-btn">Sil</button>
      </div>
    `;

    container.appendChild(card);
  });


  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      const ev = events.find(e => e.id === id);
      if (ev) fillForm(ev);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.getAttribute("data-id"));
      if (confirm("Bu etkinliği silmek istediğine emin misin?")) {
        await deleteEvent(id);
      }
    });
  });
}


function setupForm() {
  const form = document.getElementById("eventForm");
  const resetBtn = document.getElementById("resetForm");
  const result = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("eventId").value;
    const data = {
      id: id ? parseInt(id) : 0,
      title: document.getElementById("title").value,
      date: document.getElementById("date").value,
      location: document.getElementById("location").value,
      description: document.getElementById("description").value,
      imageUrl: ""
    };

    try {
      let response;
      if (id) {
        
        response = await fetch(`${API_BASE}/api/Events/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Güncelleme başarısız");
        result.style.color = "green";
        result.textContent = "Etkinlik güncellendi.";
      } else {
        
        response = await fetch(`${API_BASE}/api/Events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Ekleme başarısız");
        result.style.color = "green";
        result.textContent = "Etkinlik eklendi.";
      }

      form.reset();
      document.getElementById("eventId").value = "";
      await loadEvents();
    } catch (err) {
      console.error(err);
      result.style.color = "red";
      result.textContent = "Bir hata oluştu.";
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    document.getElementById("eventId").value = "";
    result.textContent = "";
  });
}

function fillForm(ev) {
  document.getElementById("eventId").value = ev.id;
  document.getElementById("title").value = ev.title;
  document.getElementById("date").value = ev.date;
  document.getElementById("location").value = ev.location;
  document.getElementById("description").value = ev.description;
}


async function deleteEvent(id) {
  try {
    const response = await fetch(`${API_BASE}/api/Events/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Silme başarısız");
    await loadEvents();
  } catch (err) {
    console.error(err);
    alert("Silme sırasında hata oluştu.");
  }
}


function setupCalendarNav() {
  document.getElementById("prev-month").addEventListener("click", () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    renderCalendar();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    renderCalendar();
  });
}

function renderCalendar() {
  const monthLabel = document.getElementById("month-label");
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  
  const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  daysOfWeek.forEach(d => {
    const cell = document.createElement("div");
    cell.className = "calendar-day-name";
    cell.textContent = d;
    grid.appendChild(cell);
  });

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; 
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-empty";
    grid.appendChild(emptyCell);
  }

  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateString(currentYear, currentMonth + 1, day);

    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = day;

    
    const hasEvent = events.some(ev => ev.date === dateStr);
    if (hasEvent) {
      cell.classList.add("has-event");
    }

    cell.addEventListener("click", () => {
      renderEventsList(dateStr);
      const dateInput = document.getElementById("date");
      if (dateInput) dateInput.value = dateStr;
    });

    grid.appendChild(cell);
  }
}

function toDateString(year, month, day) {
  const m = month.toString().padStart(2, "0");
  const d = day.toString().padStart(2, "0");
  return `${year}-${m}-${d}`; 
}
