using AnkuCaz.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AnkuCazContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // ✅ SchemaId çakışmasını çözer (UpdateEventDto gibi aynı isimler patlamaz)
    c.CustomSchemaIds(t => t.FullName);
    c.OperationFilter<AnkuCaz.API.Swagger.ApiKeyOperationFilter>();
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AnkuCaz.API", Version = "v1" });

    // 🔑 X-ADMIN-KEY header'ını Swagger'a ekle
    c.AddSecurityDefinition("AdminKey", new OpenApiSecurityScheme
    {
        Description = "Admin endpoints için X-ADMIN-KEY header. Örn: ank_master_...",
        Name = "X-ADMIN-KEY",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "AdminKeyScheme"
    });

    // 🔑 X-STAFF-KEY header'ını Swagger'a ekle (ileride role sistemi için)
    c.AddSecurityDefinition("StaffKey", new OpenApiSecurityScheme
    {
        Description = "Staff endpoints için X-STAFF-KEY header. Örn: ank_....",
        Name = "X-STAFF-KEY",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "StaffKeyScheme"
    });
    // ✅ Swagger'ın header'ı gerçekten request'e eklemesi için şart
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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

});

builder.Services.AddCors(options =>
{
    options.AddPolicy("OpenCors", policy =>
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("OpenCors");

app.UseAuthorization();
app.MapControllers();

app.Run();
