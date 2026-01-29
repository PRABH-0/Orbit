using System;

namespace Orbit_BE.Entities
{
    public class CanvasEdge
    {
        public Guid Id { get; set; }

        public Guid FromNodeId { get; set; }
        public Guid ToNodeId { get; set; }

        // Active / Inactive / Deleted
        public string RecordState { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        // Navigation
        public Node FromNode { get; set; } = null!;
        public Node ToNode { get; set; } = null!;
    }
}
