using AnkuCaz.API.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AnkuCazContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// ✅ CORS (cookie + cross-origin için şart)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ✅ Identity (UserManager/SignInManager + cookie auth)
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AnkuCazContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "ankucaz_auth";
    options.Cookie.HttpOnly = true;

    // Yerel test için:
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

    options.Cookie.Domain = null;

    // API olduğu için redirect yerine 401/403 dön
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(t => t.FullName!.Replace("+", "."));
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AnkuCaz.API", Version = "v1" });
});

var app = builder.Build();

// (Opsiyonel)
app.UseHttpsRedirection();

// ✅ Sıra: CORS -> Auth -> Authorization
app.UseCors("DevCors");           // ✅ düzeltildi (FrontEnd değil!)
app.UseAuthentication();
app.UseAuthorization();

// ✅ Swagger sadece Development'ta açık + sadece login olmuş kullanıcı görsün
if (app.Environment.IsDevelopment())
{
    app.UseWhen(ctx => ctx.Request.Path.StartsWithSegments("/swagger"), swaggerApp =>
    {
        swaggerApp.Use(async (ctx, next) =>
        {
            if (ctx.User?.Identity?.IsAuthenticated != true)
            {
                ctx.Response.StatusCode = 401;
                await ctx.Response.WriteAsync("Swagger icin login olmalisin.");
                return;
            }

            // Sadece SuperAdmin olsun istersen:
            // if (!ctx.User.IsInRole("SuperAdmin"))
            // {
            //     ctx.Response.StatusCode = 403;
            //     await ctx.Response.WriteAsync("Swagger sadece SuperAdmin icin.");
            //     return;
            // }

            await next();
        });
    });

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.ConfigObject.AdditionalItems["withCredentials"] = true;
    });
}

app.MapControllers();

// ✅ Seed Verisi Ekleme
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AnkuCazContext>();
    var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    context.Database.Migrate();

    string[] roles = ["SuperAdmin", "Admin", "Editor", "Viewer"];
    foreach (var r in roles)
        if (!await roleManager.RoleExistsAsync(r))
            await roleManager.CreateAsync(new IdentityRole(r));

    var adminEmail = "admin@ankucaz.local";
    var user = await userManager.FindByEmailAsync(adminEmail);

    if (user == null)
    {
        user = new IdentityUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
        var result = await userManager.CreateAsync(user, "Admin123!");
        if (!result.Succeeded)
            Console.WriteLine(string.Join("\n", result.Errors.Select(e => e.Description)));
    }

    if (user != null && !await userManager.IsInRoleAsync(user, "SuperAdmin"))
        await userManager.AddToRoleAsync(user, "SuperAdmin");
}

app.Run();
