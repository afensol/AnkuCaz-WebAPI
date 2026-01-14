const API_BASE = "http://localhost:5005";

let events = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  setupCalendarNav();
  loadEvents();
});

async function loadEvents() {
  const container = document.getElementById("events-container");
  try {
    const response = await fetch(`${API_BASE}/api/Events`);
    if (!response.ok) throw new Error("Etkinlikler alınamadı");

    events = await response.json();

    renderEventsList();   
    renderCalendar();    
  } catch (err) {
    console.error(err);
    if (container) container.innerHTML = "<p>Etkinlikler yüklenirken hata oluştu.</p>";
  }
}

function fmtDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function renderEventsList(filterDate = null) {
  const container = document.getElementById("events-container");
  if (!container) return;

  container.innerHTML = "";

  let filtered = events;
  if (filterDate) {
    filtered = events.filter(ev => fmtDate(ev.startDate) === filterDate);
  }

  if (!filtered.length) {
    container.innerHTML = "<p>Bu tarihte etkinlik bulunmuyor.</p>";
    return;
  }

  filtered.forEach(ev => {
    const start = fmtDate(ev.startDate);
    const end = fmtDate(ev.endDate);

    const mekan = [ev.locationName, ev.locationAddress].filter(Boolean).join(" — ");

    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${ev.title ?? ""}</h3>
      <p><strong>Tarih:</strong> ${start}${end && end !== start ? ` → ${end}` : ""}</p>
      <p><strong>Mekan:</strong> ${mekan || "—"}</p>
      <a class="detail-link" href="etkinlik_kayıt.html?id=${ev.id}">Detay / Kayıt</a>
    `;

    container.appendChild(card);
  });
}

function setupCalendarNav() {
  document.getElementById("prev-month")?.addEventListener("click", () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    renderCalendar();
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
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
  if (!monthLabel || !grid) return;

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

    const hasEvent = events.some(ev => fmtDate(ev.startDate) === dateStr);
    if (hasEvent) cell.classList.add("has-event");

    cell.addEventListener("click", () => {
      renderEventsList(dateStr);
    });

    grid.appendChild(cell);
  }
}

function toDateString(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
