using System;
using System.Collections.Generic;

namespace Orbit_BE.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string Username { get; set; } = null!;
        public string Email { get; set; } = null;
        public string? PasswordHash { get; set; }
        public bool IsAdmin { get; set; }

        // Online / Offline
        public string UserStatus { get; set; } = "Offline";

        // Active / Inactive / Deleted
        public string RecordState { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        // Navigation
        public ICollection<Node> Nodes { get; set; } = new List<Node>();
    }
}
