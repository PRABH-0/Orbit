using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;
using Snera_Core.Services;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;

namespace Orbit_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUnitOfWork unitOfWork,
            JwtService jwtService,
            IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _configuration = configuration;
        }

        // =========================
        // REGISTER
        // =========================
        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            var existing = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existing != null)
                throw new InvalidOperationException("User already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RecordState = "Active",
                UserStatus = "Offline",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username
            };
        }

        // =========================
        // LOGIN
        // =========================
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null ||
                !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials");

            var accessToken = _jwtService.CreateToken(user);
            var refreshToken = CreateRefreshToken(user.Id);

            await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token
            };
        }

        // =========================
        // GOOGLE LOGIN
        // =========================
        public async Task<AuthResponseDto> GoogleLoginAsync(string idToken)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _configuration["GoogleAuth:ClientId"] }
                });

            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = payload.Name ?? payload.Email,
                    Email = payload.Email,
                    ProfilePictureUrl = payload.Picture,
                    RecordState = "Active",
                    UserStatus = "Online",
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
            }
            else
            {
                user.UserStatus = "Online";
                user.ProfilePictureUrl = payload.Picture;
                _unitOfWork.Users.Update(user);
            }

            var accessToken = _jwtService.CreateToken(user);
            var refreshToken = CreateRefreshToken(user.Id);

            await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ProfilePictureUrl = user.ProfilePictureUrl
            };
        }

        // =========================
        // REFRESH TOKEN
        // =========================
        public async Task<AuthResponseDto> RefreshTokenAsync(string token)
        {
            var storedToken = await _unitOfWork.RefreshTokens
                .FirstOrDefaultAsync(rt =>
                    rt.Token == token &&
                    !rt.IsRevoked &&
                    rt.ExpiresAt > DateTime.UtcNow);

            if (storedToken == null)
                throw new UnauthorizedAccessException("Invalid refresh token");

            storedToken.IsRevoked = true;

            var newRefreshToken = CreateRefreshToken(storedToken.UserId);
            var user = await _unitOfWork.Users.GetByIdAsync(storedToken.UserId);
            var newAccessToken = _jwtService.CreateToken(user);

            await _unitOfWork.RefreshTokens.AddAsync(newRefreshToken);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken.Token
            };
        }

        // =========================
        // LOGOUT
        // =========================
        public async Task LogoutAsync(Guid userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null) return;

            user.UserStatus = "Offline";
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        // =========================
        // HELPERS
        // =========================
       
        private RefreshToken CreateRefreshToken(Guid userId)
        {
            return new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = Convert.ToBase64String(
                    RandomNumberGenerator.GetBytes(64)
                ),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
        }

        public async Task<UserDetilsResponseDto?> GetUserDetailsAsync(Guid userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null) return null;

            return new UserDetilsResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                UserStatus = user.UserStatus,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
