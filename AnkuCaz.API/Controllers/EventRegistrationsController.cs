using System.Text;
using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Authorization;
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

       
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,Viewer")]
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

       
        [HttpGet("export")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ExportCsv([FromQuery] int eventId)
        {
            if (eventId <= 0) return BadRequest("eventId geçersiz.");

            var ev = await _context.Events.AsNoTracking()
                .Where(e => e.Id == eventId)
                .Select(e => new { e.Id, e.Title })
                .FirstOrDefaultAsync();

            if (ev == null) return NotFound("Event bulunamadı.");

            var rows = await _context.EventRegistrations.AsNoTracking()
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.RegisteredAt)
                .Select(r => new { r.FullName, r.Email, r.RegisteredAt })
                .ToListAsync();

            static string Esc(string s)
            {
                s ??= "";
                if (s.Contains('"') || s.Contains(',') || s.Contains('\n') || s.Contains('\r'))
                    return "\"" + s.Replace("\"", "\"\"") + "\"";
                return s;
            }

            var sb = new StringBuilder();
            sb.AppendLine("FullName,Email,RegisteredAt(UTC)");
            foreach (var r in rows)
                sb.AppendLine($"{Esc(r.FullName)},{Esc(r.Email)},{r.RegisteredAt:O}");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"ankucaz_event_{ev.Id}_registrations.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }


        [HttpPost]
        [AllowAnonymous]
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
                return Conflict("Bu email bu etkinliğe zaten kayıtlı.");
            }

            return Ok(new { message = "Kayıt alındı", reg.Id });
        }


        [HttpDelete("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
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
