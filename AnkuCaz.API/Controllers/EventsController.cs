using AnkuCaz.API.Data;
using AnkuCaz.API.Dtos;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public EventsController(AnkuCazContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Events
                .AsNoTracking()
                .OrderBy(e => e.StartDate)
                .Select(e => new EventListDto(
                    e.Id,
                    e.Title,
                    e.LocationName,
                    e.LocationAddress,
                    e.StartDate,
                    e.EndDate,
                    e.Description ?? ""
                ))
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ev = await _context.Events
                .AsNoTracking()
                .Where(e => e.Id == id)
                .Select(e => new EventDetailDto(
                    e.Id,
                    e.Title,
                    e.LocationName,
                    e.LocationAddress,
                    e.StartDate,
                    e.EndDate,
                    e.Description ?? ""
                ))
                .FirstOrDefaultAsync();

            if (ev == null) return NotFound();
            return Ok(ev);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Title zorunlu.");

            if (string.IsNullOrWhiteSpace(dto.LocationName) || string.IsNullOrWhiteSpace(dto.LocationAddress))
                return BadRequest("LocationName ve LocationAddress zorunlu.");

            if (dto.EndDate < dto.StartDate)
                return BadRequest("EndDate, StartDate'ten küçük olamaz.");

            var ev = new Event
            {
                Title = dto.Title.Trim(),
                LocationName = dto.LocationName.Trim(),
                LocationAddress = dto.LocationAddress.Trim(),
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description ?? ""
            };

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, new { ev.Id });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventDto dto)
        {
            if (id != dto.Id) return BadRequest("URL id ile body Id aynı olmalı.");
            if (dto.EndDate < dto.StartDate) return BadRequest("EndDate, StartDate'ten küçük olamaz.");

            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            ev.Title = dto.Title.Trim();
            ev.LocationName = dto.LocationName.Trim();
            ev.LocationAddress = dto.LocationAddress.Trim();
            ev.StartDate = dto.StartDate;
            ev.EndDate = dto.EndDate;
            ev.Description = dto.Description ?? "";

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
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
