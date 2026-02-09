using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Files;
using System.Security.Claims;

namespace Orbit_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 🔐 JWT required
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;

        public FileController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] UploadFileRequestDto request)
        {
            var userId = GetUserIdFromToken();

            var result = await _fileService.UploadAsync(userId, request);

            return Ok(result);
        }

        [HttpGet("node/{nodeId}")]
        public async Task<IActionResult> GetFilesByNode(Guid nodeId)
        {
            var userId = GetUserIdFromToken();

            var files = await _fileService.GetFilesByNodeAsync(userId, nodeId);

            return Ok(files);
        }

        [HttpGet("{fileId}/download")]
        public async Task<IActionResult> Download(Guid fileId)
        {
            var userId = GetUserIdFromToken();

            var result = await _fileService.DownloadAsync(userId, fileId);

            Response.Headers.Add(
                "X-Cache",
                result.FromCache ? "HIT" : "MISS"
            );

            return File(
                result.FileBytes,
                result.ContentType,
                result.FileName
            );
        }
        [AllowAnonymous]
        [HttpGet("{fileId}/view")]
        public IActionResult View(Guid fileId)
        {
            var (stream, contentType, fileName) =
                _fileService.ViewStream(fileId);

            Response.Headers.Add("Accept-Ranges", "bytes");

            return File(
                stream,
                contentType,
                enableRangeProcessing: true
            );
        }

        [HttpDelete("{fileId}")]
        public async Task<IActionResult> Delete(Guid fileId)
        {
            var userId = GetUserIdFromToken();

            await _fileService.DeleteAsync(userId, fileId);

            return NoContent();
        }

        private Guid GetUserIdFromToken()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst("sub");

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                throw new SecurityTokenException("Invalid token");

            return userId;
        }

    }
}
