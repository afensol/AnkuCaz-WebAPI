using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnkuCaz.API.Security;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [AdminKey]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AnkuCazContext _context;
        public UsersController(AnkuCazContext context) => _context = context;

        public record CreateUserDto(string FullName, string Email, string? Role);

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _context.Users.AsNoTracking().OrderByDescending(u => u.Id).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("FullName is required.");
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            var email = dto.Email.Trim().ToLowerInvariant();

            var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (exists) return Conflict("Email already exists.");

            var role = string.IsNullOrWhiteSpace(dto.Role) ? "user" : dto.Role.Trim().ToLowerInvariant();
            if (role is not ("admin" or "organizer" or "user"))
                return BadRequest("Role must be one of: admin, organizer, user.");

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest("FullName is required.");
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            var email = dto.Email.Trim().ToLowerInvariant();

            // Başka user'da aynı email var mı?
            var emailTaken = await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == email);
            if (emailTaken) return Conflict("Email already exists.");

            var role = string.IsNullOrWhiteSpace(dto.Role) ? user.Role : dto.Role.Trim().ToLowerInvariant();
            if (role is not ("admin" or "organizer" or "user"))
                return BadRequest("Role must be one of: admin, organizer, user.");

            user.FullName = dto.FullName.Trim();
            user.Email = email;
            user.Role = role;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
