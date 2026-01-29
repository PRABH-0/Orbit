using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;

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
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }

        [HttpPut("status/{userId}")]
        public async Task<IActionResult> UpdateStatus(Guid userId, [FromQuery] string status)
        {
            await _authService.UpdateUserStatusAsync(userId, status);
            return NoContent();
        }
    }

}
