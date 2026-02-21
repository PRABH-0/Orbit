using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/google-photos")]
    public class GooglePhotosController : ControllerBase
    {
        private readonly IGooglePhotosService _photosService;

        public GooglePhotosController(IGooglePhotosService photosService)
        {
            _photosService = photosService;
        }

        [HttpGet("media")]
        public async Task<IActionResult> GetPhotos()
        {
            var token = Request.Headers["Google-Access-Token"].ToString();

            if (string.IsNullOrEmpty(token))
                return Unauthorized();

            var items = await _photosService.GetPhotosAsync(token);

            return Ok(items);
        }
    }
}
