namespace Orbit_BE.Models.Users
{
    public class UserDetilsResponseDto
    {
        public Guid Id { get; set; }

        public string Username { get; set; } = null!;
        public string Email { get; set; } = null;
        public bool IsAdmin { get; set; }

        // Online / Offline
        public string UserStatus { get; set; } = "Offline";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }
    }
}
