using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AnkuCaz.API.Swagger
{
    public class ApiKeyOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Controller/Action üzerindeki attribute'ları oku
            var attrs = context.MethodInfo.DeclaringType?
                            .GetCustomAttributes(true)
                            .Concat(context.MethodInfo.GetCustomAttributes(true))
                            .ToList()
                        ?? context.MethodInfo.GetCustomAttributes(true).ToList();

            bool requireAdmin = attrs.Any(a =>a.GetType().Name.Contains("AdminKey"));
            bool requireStaff = attrs.Any(a => a.GetType().Name.Contains("RequireStaffRole"));

            // Eğer endpoint hiçbir şey istemiyorsa dokunma (public endpoint)
            if (!requireAdmin && !requireStaff) return;

            operation.Security ??= new List<OpenApiSecurityRequirement>();

            // Admin-only: sadece AdminKey
            if (requireAdmin && !requireStaff)
            {
                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "AdminKey"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
                return;
            }

            // StaffRole attribute'u varsa (senin mantığında admin bypass var):
            // Staff OR Admin şeklinde göster (OpenAPI'de liste elemanları OR'dur)
            if (requireStaff)
            {
                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "AdminKey"
                            }
                        },
                        Array.Empty<string>()
                    }
                });

                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "StaffKey"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            }
        }
    }
}
