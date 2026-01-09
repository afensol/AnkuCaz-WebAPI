using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnkuCaz.API.Dtos;


namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly AnkuCazContext _context;

        public EventsController(AnkuCazContext context)
        {
            _context = context;
        }

        public record UpdateEventDto(
            int Id,
            string Title,
            string Description,
            DateTime StartDate,
            DateTime EndDate,
            string? ImageUrl,
            int? CategoryId,
            int? VenueId
        );

        [HttpGet]
public async Task<IActionResult> GetAll()
{
    var eventsList = await _context.Events
        .AsNoTracking()
        .Include(e => e.Category)
        .Include(e => e.Venue)
        .OrderBy(e => e.StartDate)
        .Select(e => new EventListDto(
            e.Id,
            e.Title,
            e.StartDate,
            e.EndDate,
            e.ImageUrl,
            e.CategoryId,
            e.Category != null ? e.Category.Name : null,
            e.VenueId,
            e.Venue != null ? e.Venue.Name : null
        ))
        .ToListAsync();

    return Ok(eventsList);
}
public record EventDetailDto(
    int Id,
    string Title,
    string Description,
    DateTime StartDate,
    DateTime EndDate,
    string? ImageUrl,
    int? CategoryId,
    string? CategoryName,
    int? VenueId,
    string? VenueName
);

       [HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    var ev = await _context.Events
        .AsNoTracking()
        .Include(e => e.Category)
        .Include(e => e.Venue)
        .Where(e => e.Id == id)
        .Select(e => new EventDetailDto(
            e.Id,
            e.Title,
            e.Description,
            e.StartDate,
            e.EndDate,
            e.ImageUrl,
            e.CategoryId,
            e.Category != null ? e.Category.Name : null,
            e.VenueId,
            e.Venue != null ? e.Venue.Name : null
        ))
        .FirstOrDefaultAsync();

    if (ev == null) return NotFound();
    return Ok(ev);
}


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
        {
            // 0 => seçilmedi kabul et (Swagger/Frontend bazen 0 yollar)
            var categoryId = dto.CategoryId is 0 ? null : dto.CategoryId;
            var venueId = dto.VenueId is 0 ? null : dto.VenueId;

            // (Opsiyonel) tarih kontrolü
            if (dto.EndDate < dto.StartDate)
                return BadRequest("EndDate, StartDate'ten küçük olamaz.");

            // FK kontrolü: sadece gerçek bir Id geldiyse kontrol et
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                var catExists = await _context.Categories.AnyAsync(c => c.Id == categoryId.Value);
                if (!catExists) return BadRequest("CategoryId geçersiz (Categories tablosunda böyle bir Id yok).");
            }

            if (venueId.HasValue && venueId.Value > 0)
            {
                var venueExists = await _context.Venues.AnyAsync(v => v.Id == venueId.Value);
                if (!venueExists) return BadRequest("VenueId geçersiz (Venues tablosunda böyle bir Id yok).");
            }

            var ev = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                ImageUrl = dto.ImageUrl,
                CategoryId = categoryId,
                VenueId = venueId
            };

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventDto dto)
        {
            if (id != dto.Id) return BadRequest("URL id ile body içindeki Id aynı olmalı.");

            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            // 0 => seçilmedi kabul et
            var categoryId = dto.CategoryId is 0 ? null : dto.CategoryId;
            var venueId = dto.VenueId is 0 ? null : dto.VenueId;

            // (Opsiyonel) tarih kontrolü
            if (dto.EndDate < dto.StartDate)
                return BadRequest("EndDate, StartDate'ten küçük olamaz.");

            // FK kontrolü
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                var catExists = await _context.Categories.AnyAsync(c => c.Id == categoryId.Value);
                if (!catExists) return BadRequest("CategoryId geçersiz (Categories tablosunda böyle bir Id yok).");
            }

            if (venueId.HasValue && venueId.Value > 0)
            {
                var venueExists = await _context.Venues.AnyAsync(v => v.Id == venueId.Value);
                if (!venueExists) return BadRequest("VenueId geçersiz (Venues tablosunda böyle bir Id yok).");
            }

            ev.Title = dto.Title;
            ev.Description = dto.Description;
            ev.StartDate = dto.StartDate;
            ev.EndDate = dto.EndDate;
            ev.ImageUrl = dto.ImageUrl;
            ev.CategoryId = categoryId;
            ev.VenueId = venueId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
