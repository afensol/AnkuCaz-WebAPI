using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AnkuCaz.API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "SuperAdmin")]
    public class UsersAdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UsersAdminController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public record CreateUserRequest(string Email, string Password);
        public record SetRoleRequest(string Email, string Role);

        // ✅ Kulüp üyesi oluştur (istersen bu endpointi sonra kapatırsın)
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        {
            var exists = await _userManager.FindByEmailAsync(req.Email);
            if (exists != null) return BadRequest("User already exists.");

            var user = new IdentityUser
            {
                UserName = req.Email,
                Email = req.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            // default role
            await _userManager.AddToRoleAsync(user, "Viewer");

            return Ok(new { user.Email, Role = "Viewer" });
        }

        [HttpPost("set-role")]
        public async Task<IActionResult> SetRole([FromBody] SetRoleRequest req)
        {
            if (!await _roleManager.RoleExistsAsync(req.Role))
                return BadRequest("Role not found.");

            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null) return NotFound("User not found.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, req.Role);

            return Ok(new { req.Email, Role = req.Role });
        }
    }
}
