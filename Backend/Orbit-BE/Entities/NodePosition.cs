using System;

namespace Orbit_BE.Entities
{
    public class NodePosition
    {
        public Guid Id { get; set; }

        public Guid NodeId { get; set; }

        public float X { get; set; }
        public float Y { get; set; }

        // Active / Inactive / Deleted
        public string RecordState { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        // Navigation
        public Node Node { get; set; } = null!;
    }
}
