using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using AnkuCaz.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnkuCaz.API.Dtos;
namespace AnkuCaz.API.Controllers
{
    [Route("api/admin/events")]
    [ApiController]
    [AdminKey]
    [RequireStaffRole("admin", "organizer")]

    public class AdminEventsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public AdminEventsController(AnkuCazContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Events.AsNoTracking().OrderByDescending(e => e.Id).ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
        {
            if (dto.EndDate < dto.StartDate) return BadRequest("EndDate < StartDate olamaz.");

            var categoryId = dto.CategoryId is 0 ? null : dto.CategoryId;
            var venueId = dto.VenueId is 0 ? null : dto.VenueId;

            var ev = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? "" : dto.ImageUrl,
                CategoryId = categoryId,
                VenueId = venueId
            };

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { id = ev.Id }, ev);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventDto dto)
        {
            if (id != dto.Id) return BadRequest("URL id ile body Id aynı olmalı.");

            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            if (dto.EndDate < dto.StartDate) return BadRequest("EndDate < StartDate olamaz.");

            var categoryId = dto.CategoryId is 0 ? null : dto.CategoryId;
            var venueId = dto.VenueId is 0 ? null : dto.VenueId;

            ev.Title = dto.Title;
            ev.Description = dto.Description;
            ev.StartDate = dto.StartDate;
            ev.EndDate = dto.EndDate;
            ev.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? ev.ImageUrl : dto.ImageUrl;
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
