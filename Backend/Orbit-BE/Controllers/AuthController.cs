using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interfaces;
using System.Security.Claims;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // =========================
        // GET CURRENT USER PROFILE
        // =========================
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var supabaseUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(supabaseUserId))
                    return Unauthorized();

                var user = await _authService.GetCurrentUserAsync(supabaseUserId);

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // =========================
        // HEALTH CHECK (NO AUTH)
        // =========================
        [AllowAnonymous]
        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok("API is running");
        }

        // =========================
        // LOGOUT
        // =========================
        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logout handled on client side" });
        }
    }
}
