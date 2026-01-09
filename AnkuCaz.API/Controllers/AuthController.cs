using AnkuCaz.API.Data;
using AnkuCaz.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly AnkuCazContext _db;

        public AuthController(IConfiguration config, AnkuCazContext db)
        {
            _config = config;
            _db = db;
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var master = _config["Admin:Key"];
            var adminKey = Request.Headers["X-ADMIN-KEY"].ToString();
            if (!string.IsNullOrWhiteSpace(master) && adminKey == master)
                return Ok(new { type = "admin", role = "admin" });

            var staffKey = Request.Headers["X-STAFF-KEY"].ToString();
            if (string.IsNullOrWhiteSpace(staffKey))
                return Unauthorized(new { error = "No key" });

            var hash = KeyHash.Sha256(staffKey);
            var row = await _db.StaffApiKeys.AsNoTracking()
                .FirstOrDefaultAsync(x => x.IsActive && x.KeyHash == hash);

            if (row == null) return Unauthorized(new { error = "Invalid staff key" });

            return Ok(new { type = "staff", role = row.Role, name = row.Name });
        }
    }
}
