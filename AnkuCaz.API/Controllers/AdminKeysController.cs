using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using AnkuCaz.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using AnkuCaz.API.Dtos;


namespace AnkuCaz.API.Controllers
{
    [ApiController]
    [Route("api/admin/keys")]
    public class AdminKeysController : ControllerBase
    {
        private readonly AnkuCazContext _db;
        public AdminKeysController(AnkuCazContext db) => _db = db;

        // master admin key şart
        [AdminKey]
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var keys = await _db.StaffApiKeys
                .OrderByDescending(x => x.Id)
                .Select(x => new { x.Id, x.Name, x.Role, x.IsActive, x.CreatedAt })
                .ToListAsync();

            return Ok(keys);
        }

        [AdminKey]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateKeyDto dto)
        {
            var role = (dto.Role ?? "viewer").ToLowerInvariant();
            if (role != "admin" && role != "organizer" && role != "viewer")
                return BadRequest("Role admin|organizer|viewer olmalı.");

            var plain = GenerateKey();

            var row = new StaffApiKey
            {
                Name = dto.Name ?? "",
                Role = role,
                KeyHash = KeyHash.Sha256(plain),
                IsActive = true
            };

            _db.StaffApiKeys.Add(row);
            await _db.SaveChangesAsync();

            // ⚠️ plain key sadece burada döner (bir daha göremezsin)
            return Ok(new { row.Id, row.Name, row.Role, key = plain });
        }

        [AdminKey]
        [HttpPost("{id:int}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var row = await _db.StaffApiKeys.FirstOrDefaultAsync(x => x.Id == id);
            if (row == null) return NotFound();
            row.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok();
        }

        static string GenerateKey()
        {
            // 32 byte random -> base64url
            var bytes = RandomNumberGenerator.GetBytes(32);
            var b64 = Convert.ToBase64String(bytes)
                .Replace("+", "-").Replace("/", "_").TrimEnd('=');
            return "ank_" + b64;
        }
    }
}
