using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrationsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public RegistrationsController(AnkuCazContext context) => _context = context;

        public record CreateRegistrationDto(int EventId, int UserId);

        public record CreateRegistrationByInfoDto(int EventId, string FullName, string Email);


        // GET /api/Registrations
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var regs = await _context.Registrations
                .AsNoTracking()
                .Include(r => r.Event)
                .Include(r => r.User)
                .OrderByDescending(r => r.Id)
                .Select(r => new
                {
                    r.Id,
                    r.EventId,
                    EventTitle = r.Event.Title,
                    r.UserId,
                    UserFullName = r.User.FullName,
                    UserEmail = r.User.Email,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(regs);
        }
        // GET /api/Registrations/byEvent/5
        [HttpGet("byEvent/{eventId}")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            var regs = await _context.Registrations
                .AsNoTracking()
                .Where(r => r.EventId == eventId)
                .Include(r => r.User)
                .OrderByDescending(r => r.Id)
                .Select(r => new
                {
                    r.Id,
                    r.EventId,
                    r.UserId,
                    UserFullName = r.User.FullName,
                    UserEmail = r.User.Email,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(regs);
        }

        [HttpPost("byInfo")]
    public async Task<IActionResult> CreateByInfo(CreateRegistrationByInfoDto dto)
    {
    if (dto.EventId <= 0) return BadRequest("EventId invalid.");
    if (string.IsNullOrWhiteSpace(dto.FullName)) return BadRequest("FullName is required.");
    if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest("Email is required.");

    var ev = await _context.Events.FindAsync(dto.EventId);
    if (ev == null) return NotFound("Event not found.");

    var email = dto.Email.Trim().ToLower();
    var fullName = dto.FullName.Trim();

    // 1) Email'e göre user var mı? Yoksa oluştur
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
    if (user == null)
    {
        user = new User
        {
            FullName = fullName,
            Email = email,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }

    // 2) Duplicate kayıt engeli
    var exists = await _context.Registrations.AnyAsync(r =>
        r.EventId == dto.EventId && r.UserId == user.Id && r.Status == "registered");

    if (exists) return Conflict("User is already registered to this event.");

    // 3) Registration oluştur
    var reg = new Registration
    {
        EventId = dto.EventId,
        UserId = user.Id,
        Status = "registered",
        CreatedAt = DateTime.UtcNow
    };

    _context.Registrations.Add(reg);
    await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Registered successfully",
            reg.Id,
            reg.EventId,
            reg.UserId,
            UserFullName = user.FullName,
            user.Email,
            reg.Status,
            reg.CreatedAt
        });
    }

        // POST /api/Registrations  { "eventId": 1, "userId": 2 }
        [HttpPost]
        public async Task<IActionResult> Create(CreateRegistrationDto dto)
        {
            // Event var mı?
            var ev = await _context.Events.FindAsync(dto.EventId);
            if (ev == null) return NotFound("Event not found.");

            // User var mı?
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("User not found.");

            // Aynı user aynı event’e tekrar kayıt olmasın (aktif kayıt)
            var exists = await _context.Registrations.AnyAsync(r =>
                r.EventId == dto.EventId && r.UserId == dto.UserId && r.Status == "registered");

            if (exists) return Conflict("User is already registered to this event.");

            var reg = new Registration
            {
                EventId = dto.EventId,
                UserId = dto.UserId,
                Status = "registered",
                CreatedAt = DateTime.UtcNow
            };

            _context.Registrations.Add(reg);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { id = reg.Id }, new
{
    reg.Id,
    reg.EventId,
    EventTitle = ev.Title,
    reg.UserId,
    UserFullName = user.FullName,
    reg.Status,
    reg.CreatedAt
});

        }

        // DELETE /api/Registrations/5  (kayıt silmek yerine iptal etmek istersen status yaparız)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var reg = await _context.Registrations.FindAsync(id);
            if (reg == null) return NotFound();

            _context.Registrations.Remove(reg);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
