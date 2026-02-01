using Orbit_BE.Models.Users;

namespace Orbit_BE.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task<UserDetilsResponseDto> GetUserDetailsAsync(Guid userId);
        Task LogoutAsync(Guid userId);
        Task<AuthResponseDto> GoogleLoginAsync(string idToken);


    }

}
