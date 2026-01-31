using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.Services;
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
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }


        [Authorize]
    [HttpGet("userDetails")]
    public async Task<IActionResult> GetUserDetails()
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier) ??
            User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized();

        var user = await _authService.GetUserDetailsAsync(userId);

        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }


}

}
