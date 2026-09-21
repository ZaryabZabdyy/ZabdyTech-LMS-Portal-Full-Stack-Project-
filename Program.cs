using Microsoft.EntityFrameworkCore;
using ZabdyTech.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // 1. Database Connection Setup (PostgreSQL / Supabase)
        var connectionstring = builder.Configuration.GetConnectionString("DefaultConnection");
        builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionstring));
        
        var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
        builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

        // 2. Optimized Single CORS Policy Setup
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("SpecificOriginPolicy", policy =>
            {
                policy.WithOrigins("https://zabdytech-lms-portal-full-stack-project-production.up.railway.app")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials(); // Authorization headers (JWT) support
            });
        });

        // 3. JWT Authentication Services Setup
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
            };
        });

        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();


        // 🎯 Yeh do lines add karni hain taake homepage.html aur static files load ho sakein
        var defaultFilesOptions = new DefaultFilesOptions();
        defaultFilesOptions.DefaultFileNames.Clear();
        defaultFilesOptions.DefaultFileNames.Add("homepage.html");
        app.UseDefaultFiles(defaultFilesOptions);
        app.UseStaticFiles();

        app.UseRouting();

        // 🎯 SINGLE CORS MIDDLEWARE (Must be placed before Authentication/Authorization)
        app.UseCors("SpecificOriginPolicy");

        app.UseAuthentication(); // Token verification
        app.UseAuthorization();  // Role / Right validation

        app.MapControllers();
        app.MapFallbackToFile("homepage.html");

        app.Run();
    }
}