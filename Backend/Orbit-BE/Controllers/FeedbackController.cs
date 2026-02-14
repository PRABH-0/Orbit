using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Orbit_BE.Models.Feedback;
using Orbit_BE.Services.Interfaces;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/feedback")]
    [Authorize] 
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpPost]
        public async Task<IActionResult> SendFeedback([FromBody] FeedbackDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Message))
                    return BadRequest("Feedback message is required");

                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;

                await _feedbackService.SendFeedbackAsync(dto, userEmail);

                return Ok(new { message = "Feedback sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "SMTP ERROR",
                    exception = ex.ToString()   // VERY IMPORTANT
                });
            }
        }


    }
}
