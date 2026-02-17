using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Orbit_BE.Data;
using Orbit_BE.Interface;
using Orbit_BE.Interfaces;
using Orbit_BE.Options;
using Orbit_BE.Repositories;
using Orbit_BE.Services;
using Orbit_BE.Services.Interfaces;
using Orbit_BE.UnitOfWork;
using Stripe;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// =======================
// Controllers
// =======================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// =======================
// Swagger
// =======================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.Configure<SupabaseOptions>(
    builder.Configuration.GetSection("Supabase"));
//builder.Services.AddDbContext<DataContext>(options =>
//    options.UseSqlServer(
//        builder.Configuration.GetConnectionString("DefaultConnection")
//    )
//);
builder.Services.AddDbContext<DataContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ).UseSnakeCaseNamingConvention()
);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://sxkegulacdjtpnifhydz.supabase.co/auth/v1";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false
        };
    });



// =======================
// ? CORS (SINGLE, CORRECT)
// =======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200") // Your Angular dev URL
            .AllowAnyMethod()
            .AllowAnyHeader();
});
});

// =======================
// DI
// =======================
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGoogleDriveService, GoogleDriveService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<INodeService, NodeService>();
builder.Services.AddScoped<IFileStorageService, SupabaseFileStorageService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileService, Orbit_BE.Services.FileService>();
//builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024 * 1024 * 500;
});
builder.Services.AddHttpClient();


var app = builder.Build();




StripeConfiguration.ApiKey =
    builder.Configuration["Stripe:SecretKey"];

app.UseHttpsRedirection();

app.UseDefaultFiles();   // 👈 must come BEFORE static files
app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Orbit API v1");
});

app.MapControllers();

app.MapFallbackToFile("index.html");

if (builder.Environment.IsProduction())
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.Run();
