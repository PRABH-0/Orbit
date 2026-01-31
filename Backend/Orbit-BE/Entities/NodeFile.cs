using System;

namespace Orbit_BE.Entities
{
    public class NodeFile
    {
        public Guid Id { get; set; }

        public Guid NodeId { get; set; }

        public string FileName { get; set; } = null!;
        public string FileType { get; set; } = null!;
        public long FileSize { get; set; }

        public string StoragePath { get; set; } = null!;

        // Active / Inactive / Deleted
        public string RecordState { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        // Navigation
        public Node Node { get; set; } = null!;
    }
}
