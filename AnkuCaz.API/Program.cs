using AnkuCaz.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AnkuCazContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(t => t.FullName);
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AnkuCaz.API", Version = "v1" });

    // ✅ Tek key: X-PANEL-KEY
    c.AddSecurityDefinition("PanelKey", new OpenApiSecurityScheme
    {
        Description = "Admin/Staff panel key. Header: X-PANEL-KEY",
        Name = "X-PANEL-KEY",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "PanelKeyScheme"
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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AnkuCaz.API.Data.AnkuCazContext>();
    Console.WriteLine("DB PROVIDER = " + db.Database.ProviderName);
    Console.WriteLine("DB DATASOURCE = " + db.Database.GetDbConnection().DataSource);
}


app.Run();
