using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AnkuCaz.API.Security
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AdminKeyAttribute : Attribute, IAsyncActionFilter
    {
        private const string HeaderName = "X-ADMIN-KEY";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var cfg = context.HttpContext.RequestServices.GetService<IConfiguration>();
            var expected = cfg?["Admin:Key"];

            if (string.IsNullOrWhiteSpace(expected))
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var provided) ||
                string.IsNullOrWhiteSpace(provided) ||
                !string.Equals(provided.ToString(), expected, StringComparison.Ordinal))
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized (missing/invalid admin key).");
                return;
            }

            await next();
        }
    }
}
