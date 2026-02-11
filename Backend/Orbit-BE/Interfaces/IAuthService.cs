using Orbit_BE.Models.Users;

namespace Orbit_BE.Interfaces
{
    public interface IAuthService
    {
        Task<UserDetilsResponseDto?> GetCurrentUserAsync(string supabaseUserId);
    }
}
