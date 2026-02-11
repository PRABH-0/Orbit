using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;
using System.Security.Claims;
using System.Text.Json;

namespace Orbit_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            IUnitOfWork unitOfWork,
            IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<UserDetilsResponseDto?> GetCurrentUserAsync(string supabaseUserId)
        {
            var userId = Guid.Parse(supabaseUserId);

            var email = GetEmailFromToken();
            var fullName = GetFullNameFromToken();
            var profilePicture = GetProfilePictureFromToken();

            var username =
                !string.IsNullOrEmpty(fullName)
                    ? fullName
                    : email?.Split('@')[0] ?? "User";

            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                user = new User
                {
                    Id = userId,
                    Username = username,
                    ProfilePictureUrl = profilePicture,
                    UserStatus = "Online",
                    RecordState = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
            }
            else
            {
                user.UserStatus = "Online";

                // 🔥 Always keep name synced with Google
                if (!string.IsNullOrEmpty(username))
                    user.Username = username;

                // 🔥 Always keep profile picture synced
                if (!string.IsNullOrEmpty(profilePicture))
                    user.ProfilePictureUrl = profilePicture;

                _unitOfWork.Users.Update(user);
            }

            await _unitOfWork.SaveChangesAsync();

            return new UserDetilsResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = email,
                ProfilePictureUrl = user.ProfilePictureUrl,
                UserStatus = user.UserStatus,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt
            };
        }

        // =============================
        // TOKEN CLAIM HELPERS
        // =============================

        private string? GetEmailFromToken()
        {
            return _httpContextAccessor.HttpContext?
                .User?
                .FindFirstValue(ClaimTypes.Email)
                ?? _httpContextAccessor.HttpContext?
                    .User?
                    .FindFirstValue("email");
        }

        private string? GetFullNameFromToken()
        {
            var metadata = _httpContextAccessor.HttpContext?
                .User?
                .FindFirstValue("user_metadata");

            if (string.IsNullOrEmpty(metadata))
                return null;

            try
            {
                using var doc = JsonDocument.Parse(metadata);

                if (doc.RootElement.TryGetProperty("full_name", out var fullName))
                    return fullName.GetString();

                if (doc.RootElement.TryGetProperty("name", out var name))
                    return name.GetString();
            }
            catch { }

            return null;
        }


        private string? GetProfilePictureFromToken()
        {
            return _httpContextAccessor.HttpContext?
                .User?
                .FindFirstValue("avatar_url")
                ?? _httpContextAccessor.HttpContext?
                    .User?
                    .FindFirstValue("picture");
        }
    }
}
