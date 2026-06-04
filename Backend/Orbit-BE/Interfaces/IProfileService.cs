using Orbit_BE.Models.Profile;

namespace Orbit_BE.Interfaces
{
    public interface IProfileService
    {
        /// <summary>
        /// Returns full profile data (user info, storage usage, account stats)
        /// for the authenticated user identified by their Supabase user ID.
        /// </summary>
        Task<ProfileResponseDto?> GetProfileAsync(string supabaseUserId);
    }
}
