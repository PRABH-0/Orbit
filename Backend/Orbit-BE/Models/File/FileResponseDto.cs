using System;

namespace Orbit_BE.Models.Files
{
    public class FileResponseDto
    {
        public Guid Id { get; set; }
        public Guid NodeId { get; set; }

        public string FileName { get; set; } = null!;
        public string ContentType { get; set; } = null!;
        public long FileSize { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
