using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;
using Snera_Core.Services;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace Orbit_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;
        public AuthService(IUnitOfWork unitOfWork, JwtService jwtService, IConfiguration configuration)
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
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("All fields are required");
            }

            var existingUser = await _unitOfWork.Users
                .FirstOrDefaultAsync(u =>
                    (u.Username == request.Username || u.Email == request.Email) &&
                    u.RecordState == "Active");

            if (existingUser != null)
                throw new InvalidOperationException("User already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserStatus = "Offline",
                IsAdmin = false,
                RecordState = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus
            };
        }

        // =========================
        // LOGIN
        // =========================
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("Email and password are required");
            }

            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == request.Email &&
                    u.RecordState == "Active");

            if (user == null)
                throw new UnauthorizedAccessException("Invalid email or password");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password");

            user.UserStatus = "Online";
            user.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _jwtService.CreateToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus,
                AccessToken = token
            };
        }

        // =========================
        // USER DETAILS
        // =========================
        public async Task<UserDetilsResponseDto?> GetUserDetailsAsync(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("Invalid user id");

            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            if (user == null || user.RecordState != "Active")
                return null;

            return new UserDetilsResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                UserStatus = user.UserStatus,
                CreatedAt = user.CreatedAt,
                LastEditedTimestamp = user.LastEditedTimestamp
            };
        }
        // =========================
        // LOGOUT
        // =========================
        public async Task LogoutAsync(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("Invalid user id");

            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            if (user == null || user.RecordState != "Active")
                return;

            user.UserStatus = "Offline";
            user.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<AuthResponseDto> GoogleLoginAsync(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken))
                throw new ArgumentException("Invalid Google token");

            GoogleJsonWebSignature.Payload payload;

            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    idToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _configuration["GoogleAuth:ClientId"] }
                    });
            }
            catch
            {
                throw new UnauthorizedAccessException("Invalid Google token");
            }

            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == payload.Email &&
                    u.RecordState == "Active");

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = payload.Name ?? payload.Email,
                    Email = payload.Email,
                    ProfilePictureUrl = payload.Picture, // ✅ GOOGLE PIC
                    PasswordHash = null,
                    UserStatus = "Online",
                    IsAdmin = false,
                    RecordState = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
            }
            else
            {
                user.UserStatus = "Online";
                user.LastEditedTimestamp = DateTime.UtcNow;

                // ✅ Update picture if changed
                if (!string.IsNullOrEmpty(payload.Picture))
                    user.ProfilePictureUrl = payload.Picture;

                _unitOfWork.Users.Update(user);
            }

            await _unitOfWork.SaveChangesAsync();

            var token = _jwtService.CreateToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus,
                AccessToken = token,
                ProfilePictureUrl = user.ProfilePictureUrl // ✅ RETURN IT
            };
        }


    }
}
