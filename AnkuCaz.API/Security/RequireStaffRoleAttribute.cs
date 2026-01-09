using AnkuCaz.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Security
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireStaffRoleAttribute : Attribute, IAsyncActionFilter
    {
        private readonly HashSet<string> _roles;

        public RequireStaffRoleAttribute(params string[] roles)
        {
            _roles = roles.Select(r => r.ToLowerInvariant()).ToHashSet();
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var http = context.HttpContext;
            var config = http.RequestServices.GetRequiredService<IConfiguration>();

            // ✅ master/admin key (appsettings)
            var master = config["Admin:Key"];

            // ✅ Admin key doğruysa staff arama (Admin her şeyi açar)
            var adminKey = http.Request.Headers["X-ADMIN-KEY"].ToString();
            if (!string.IsNullOrWhiteSpace(master) &&
                !string.IsNullOrWhiteSpace(adminKey) &&
                adminKey == master)
            {
                await next();
                return;
            }

            // ✅ Staff key zorunlu
            var staffKey = http.Request.Headers["X-STAFF-KEY"].ToString();
            if (string.IsNullOrWhiteSpace(staffKey))
            {
                context.Result = new UnauthorizedObjectResult("X-STAFF-KEY gerekli.");
                return;
            }

            // ✅ DB kontrol
            var db = http.RequestServices.GetRequiredService<AnkuCazContext>();
            var hash = KeyHash.Sha256(staffKey);

            var row = await db.StaffApiKeys
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.IsActive && x.KeyHash == hash);

            if (row == null)
            {
                context.Result = new UnauthorizedObjectResult("Staff key hatalı veya pasif.");
                return;
            }

            // ✅ Role check (admin > organizer > viewer)
            string role = (row.Role ?? "viewer").ToLowerInvariant();
            bool ok =
                _roles.Contains(role) ||
                (role == "admin" && (_roles.Contains("organizer") || _roles.Contains("viewer") || _roles.Contains("admin"))) ||
                (role == "organizer" && _roles.Contains("viewer"));

            if (!ok)
            {
                context.Result = new ObjectResult("Bu işlem için yetkin yok.")
                {
                    StatusCode = 403
                };
                return;
            }

            await next();
        }
    }
}
