using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Orbit_BE.Data;
using Orbit_BE.Interface;
using Orbit_BE.Interfaces;
using Orbit_BE.Repositories;
using Orbit_BE.Services;
using Orbit_BE.Services.Interfaces;
using Orbit_BE.UnitOfWork;
using Snera_Core.Services;
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

// =======================
// Database
// =======================
builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// =======================
// JWT Authentication
// =======================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["JwtConfig:Key"];
        if (string.IsNullOrEmpty(key))
            throw new Exception("JWT Key is missing.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtConfig:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtConfig:Audience"],

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            ),

            ClockSkew = TimeSpan.Zero
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
            .AllowAnyHeader()
            .AllowCredentials(); // ? This is important!
});
});

// =======================
// DI
// =======================
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<INodeService, NodeService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileService, Orbit_BE.Services.FileService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024 * 1024 * 500;
});

var app = builder.Build();


// =======================
// Swagger UI
// =======================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Orbit API v1");
});

// Redirect root to swagger
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/")
    {
        context.Response.Redirect("/swagger/index.html");
        return;
    }
    await next();
});
StripeConfiguration.ApiKey =
    builder.Configuration["Stripe:SecretKey"];

// =======================
// Middleware Order (IMPORTANT)
// =======================
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowAngular"); // ? MUST be here

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
