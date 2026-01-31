using Microsoft.IdentityModel.Tokens;
using Orbit_BE.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Snera_Core.Services
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),

                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration.GetValue<string>("JwtConfig:Key")!
                )
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var token = new JwtSecurityToken(
                issuer: _configuration.GetValue<string>("JwtConfig:Issuer"),
                audience: _configuration.GetValue<string>("JwtConfig:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    _configuration.GetValue<int>("JwtConfig:TokenValidityMins")
                ),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
    }
}