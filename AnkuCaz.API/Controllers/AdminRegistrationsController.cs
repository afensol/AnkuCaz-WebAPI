using AnkuCaz.API.Data;
using AnkuCaz.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/admin/registrations")]
    [ApiController]
    [AdminKey]
    [RequireStaffRole("admin", "organizer", "viewer")]
    public class AdminRegistrationsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public AdminRegistrationsController(AnkuCazContext context) => _context = context;

        // GET /api/admin/registrations/byEvent/5
        [HttpGet("byEvent/{eventId}")]
        public async Task<IActionResult> ByEvent(int eventId)
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

        // DELETE /api/admin/registrations/12
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
