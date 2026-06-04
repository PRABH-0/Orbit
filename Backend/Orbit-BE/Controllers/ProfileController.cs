using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interfaces;
using System.Security.Claims;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        // =========================
        // GET CURRENT USER PROFILE
        // =========================
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var supabaseUserId =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(supabaseUserId))
                    return Unauthorized(new { message = "User not authenticated" });

                var profile = await _profileService.GetProfileAsync(supabaseUserId);

                if (profile == null)
                    return NotFound(new { message = "User profile not found" });

                return Ok(profile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "Failed to load profile",
                    Detail = ex.Message,
                    Inner = ex.InnerException?.Message
                });
            }
        }
    }
}
