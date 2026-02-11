using System;
using System.Collections.Generic;

namespace Orbit_BE.Entities
{
    public class User
    {
        public Guid Id { get; set; }  // Must match Supabase auth.users.id

        public string Username { get; set; } = null!;
        public bool IsAdmin { get; set; }

        public string UserStatus { get; set; } = "Offline";

        public string RecordState { get; set; } = "Active";
        public string? ProfilePictureUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        public ICollection<Node> Nodes { get; set; } = new List<Node>();
    }
}
