using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnkuCaz.API.Security;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementsController : ControllerBase
    {
        private readonly AnkuCazContext _context;

        public AnnouncementsController(AnkuCazContext context)
        {
            _context = context;
        }

        // GET: /api/announcements
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/announcements/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Announcements.FindAsync(id);
            if (item == null) return NotFound();

            return Ok(item);
        }

        // POST: /api/announcements
        [AdminKey]
        [RequireStaffRole("admin", "organizer")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Announcement dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Title boş olamaz.");
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest("Content boş olamaz.");

            var entity = new Announcement
            {
                Title = dto.Title.Trim(),
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Announcements.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        // PUT: /api/announcements/{id}
        [AdminKey]  
        [RequireStaffRole("admin", "organizer")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Announcement dto)
        {
            var entity = await _context.Announcements.FindAsync(id);
            if (entity == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Title))
                entity.Title = dto.Title.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Content))
                entity.Content = dto.Content.Trim();

            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        // DELETE: /api/announcements/{id}
        [AdminKey]
        [RequireStaffRole("admin", "organizer")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Announcements.FindAsync(id);
            if (entity == null) return NotFound();

            _context.Announcements.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
