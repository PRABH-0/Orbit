namespace Orbit_BE.Models.Users
{
    public class AuthResponseDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; }
        public string UserStatus { get; set; }

        public string AccessToken { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

}
