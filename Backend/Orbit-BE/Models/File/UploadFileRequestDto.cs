using Microsoft.AspNetCore.Http;
using System;

namespace Orbit_BE.Models.Files
{
    public class UploadFileRequestDto
    {
        public Guid NodeId { get; set; }
        public IFormFile File { get; set; } = null!;
    }
}
