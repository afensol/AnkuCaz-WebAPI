using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventRegistrationsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public EventRegistrationsController(AnkuCazContext context) => _context = context;

        public record CreateEventRegistrationDto(int EventId, string FullName, string Email);

        // Admin için: event'e göre listele -> /api/EventRegistrations?eventId=3
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? eventId)
        {
            var q = _context.EventRegistrations.AsNoTracking();

            if (eventId.HasValue)
                q = q.Where(r => r.EventId == eventId.Value);

            var list = await q
                .OrderByDescending(r => r.Id)
                .Select(r => new
                {
                    r.Id,
                    r.EventId,
                    r.FullName,
                    r.Email,
                    r.RegisteredAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // Kullanıcı: kayıt oluştur
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventRegistrationDto dto)
        {
            if (dto.EventId <= 0) return BadRequest("EventId geçersiz.");
            if (string.IsNullOrWhiteSpace(dto.FullName)) return BadRequest("FullName zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest("Email zorunlu.");

            var evExists = await _context.Events.AnyAsync(e => e.Id == dto.EventId);
            if (!evExists) return NotFound("Event bulunamadı.");

            var reg = new EventRegistration
            {
                EventId = dto.EventId,
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                RegisteredAt = DateTime.UtcNow
            };

            _context.EventRegistrations.Add(reg);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Unique index: aynı email aynı event'e tekrar kayıt olamasın
                return Conflict("Bu email bu etkinliğe zaten kayıtlı.");
            }

            return Ok(new { message = "Kayıt alındı", reg.Id });
        }

        // Admin: kayıt sil
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var reg = await _context.EventRegistrations.FindAsync(id);
            if (reg == null) return NotFound();

            _context.EventRegistrations.Remove(reg);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
