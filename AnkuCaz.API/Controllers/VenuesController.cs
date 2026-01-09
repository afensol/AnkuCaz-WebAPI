using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VenuesController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public VenuesController(AnkuCazContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _context.Venues.AsNoTracking().ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var venue = await _context.Venues.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return venue == null ? NotFound() : Ok(venue);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Venue venue)
        {
            if (string.IsNullOrWhiteSpace(venue.Name))
                return BadRequest("Name is required.");

            _context.Venues.Add(venue);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = venue.Id }, venue);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Venue dto)
        {
            var venue = await _context.Venues.FindAsync(id);
            if (venue == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            venue.Name = dto.Name.Trim();
            venue.Address = dto.Address;
            venue.Capacity = dto.Capacity;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var venue = await _context.Venues.FindAsync(id);
            if (venue == null) return NotFound();

            _context.Venues.Remove(venue);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
