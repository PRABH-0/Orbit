using System;
using System.Collections.Generic;

namespace Orbit_BE.Entities
{
    public class Node
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public string Name { get; set; } = null!;

        // Tree structure
        public Guid? ParentId { get; set; }

        // For file system mapping
        public string? BasePath { get; set; }
        public string? ExternalId { get; set; }     // Google file id
        public string StorageProvider { get; set; } // "Local" | "GoogleDrive"


        // Active / Inactive / Deleted
        public string RecordState { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastEditedTimestamp { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public Node? Parent { get; set; }
        public ICollection<Node> Children { get; set; } = new List<Node>();

        public NodePosition Position { get; set; } = null!;
        public ICollection<NodeFile> Files { get; set; } = new List<NodeFile>();
    }
}
