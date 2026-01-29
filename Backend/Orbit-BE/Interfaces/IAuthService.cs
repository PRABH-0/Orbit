using Orbit_BE.Models.Users;

namespace Orbit_BE.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task UpdateUserStatusAsync(Guid userId, string status);
    }

}
