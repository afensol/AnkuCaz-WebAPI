using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public TagsController(AnkuCazContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _context.Tags.AsNoTracking().ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tag = await _context.Tags.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return tag == null ? NotFound() : Ok(tag);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Tag tag)
        {
            if (string.IsNullOrWhiteSpace(tag.Name))
                return BadRequest("Name is required.");

            tag.Name = tag.Name.Trim();

            // İsteğe bağlı: aynı isimli tag oluşmasın
            var exists = await _context.Tags.AnyAsync(t => t.Name == tag.Name);
            if (exists) return Conflict("Tag already exists.");

            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = tag.Id }, tag);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Tag dto)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            tag.Name = dto.Name.Trim();
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null) return NotFound();

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
