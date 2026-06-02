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
            try
            {
                Console.WriteLine("========== AUTH DEBUG START ==========");

                Console.WriteLine($"supabaseUserId: {supabaseUserId}");

                var userId = Guid.Parse(supabaseUserId);

                var email = GetEmailFromToken();
                var fullName = GetFullNameFromToken();
                var profilePicture = GetProfilePictureFromToken();

                Console.WriteLine($"Email: {email}");
                Console.WriteLine($"FullName: {fullName}");
                Console.WriteLine($"ProfilePicture: {profilePicture}");

                var username =
                    !string.IsNullOrEmpty(fullName)
                        ? fullName
                        : email?.Split('@')[0] ?? "User";

                Console.WriteLine($"Username: {username}");

                Console.WriteLine("Searching user in database...");

                var user = await _unitOfWork.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                Console.WriteLine(user == null
                    ? "User NOT found"
                    : $"User found: {user.Id}");

                if (user == null)
                {
                    Console.WriteLine("Creating new user...");

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

                    Console.WriteLine("User added to DbContext");
                }
                else
                {
                    Console.WriteLine("Updating existing user...");

                    Console.WriteLine($"Old Username: {user.Username}");
                    Console.WriteLine($"Old Status: {user.UserStatus}");

                    user.UserStatus = "Online";

                    if (!string.IsNullOrEmpty(username))
                        user.Username = username;

                    if (!string.IsNullOrEmpty(profilePicture))
                        user.ProfilePictureUrl = profilePicture;

                    Console.WriteLine($"New Username: {user.Username}");
                    Console.WriteLine($"New Status: {user.UserStatus}");

                    _unitOfWork.Users.Update(user);

                    Console.WriteLine("User marked as modified");
                }

                Console.WriteLine("Calling SaveChangesAsync...");

                await _unitOfWork.SaveChangesAsync();

                Console.WriteLine("SaveChangesAsync SUCCESS");

                Console.WriteLine("========== AUTH DEBUG END ==========");

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
            catch (Exception ex)
            {
                Console.WriteLine("========== AUTH ERROR ==========");
                Console.WriteLine(ex.ToString());

                throw new Exception(
                    $"AUTH DEBUG ERROR\n" +
                    $"Message: {ex.Message}\n" +
                    $"Inner: {ex.InnerException?.Message}\n" +
                    $"InnerInner: {ex.InnerException?.InnerException?.Message}\n" +
                    $"StackTrace: {ex.StackTrace}",
                    ex
                );
            }
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
            var metadata = _httpContextAccessor.HttpContext?
                .User?
                .FindFirstValue("user_metadata");

            if (string.IsNullOrEmpty(metadata))
                return null;

            try
            {
                using var doc = JsonDocument.Parse(metadata);

                if (doc.RootElement.TryGetProperty("avatar_url", out var avatar))
                    return avatar.GetString();

                if (doc.RootElement.TryGetProperty("picture", out var picture))
                    return picture.GetString();
            }
            catch
            {
                // ignore parsing errors
            }

            return null;
        }

    }
}
