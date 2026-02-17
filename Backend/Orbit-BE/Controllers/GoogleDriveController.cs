using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interfaces;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/google-drive")]
    public class GoogleDriveController : ControllerBase
    {
        private readonly IGoogleDriveService _googleDriveService;

        public GoogleDriveController(IGoogleDriveService googleDriveService)
        {
            _googleDriveService = googleDriveService;
        }

        // ==============================
        // LIST FILES
        // ==============================
        [HttpGet("files")]
        public async Task<IActionResult> GetFiles()
        {
            var token = Request.Headers["Google-Access-Token"].ToString();

            if (string.IsNullOrEmpty(token))
                return Unauthorized("Missing Google token");

            var files = await _googleDriveService.GetFilesAsync(token);

            return Ok(files);
        }

        // ==============================
        // STREAM FILE
        // ==============================
        [HttpGet("file/{fileId}")]
        public async Task<IActionResult> GetGoogleFile(string fileId)
        {
            var token = Request.Headers["Google-Access-Token"].ToString();

            if (string.IsNullOrEmpty(token))
                return Unauthorized("Missing Google token");

            try
            {
                var (stream, contentType) =
                    await _googleDriveService.GetFileStreamAsync(token, fileId);

                return File(stream, contentType, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
