using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AnkuCaz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;

        public AuthController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        // DTOs
        public record LoginRequest(string Email, string Password);
        public record UserInfoDto(string Email, IList<string> Roles);

        // =======================
        // POST /api/auth/login
        // =======================
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Email ve Password zorunlu.");

            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null)
                return Unauthorized("Kullanıcı bulunamadı.");

            var result = await _signInManager.PasswordSignInAsync(
                user,
                req.Password,
                isPersistent: true,
                lockoutOnFailure: false
            );

            if (!result.Succeeded)
                return Unauthorized("Şifre hatalı.");

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new UserInfoDto(user.Email!, roles));
        }

        // =======================
        // POST /api/auth/logout
        // =======================
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }

        // =======================
        // GET /api/auth/me
        // =======================
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new UserInfoDto(user.Email!, roles));
        }
    }
}
