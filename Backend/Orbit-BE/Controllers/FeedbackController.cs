using Microsoft.AspNetCore.Mvc;

using Orbit_BE.Models.Feedback;
using Orbit_BE.Services.Interfaces;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/feedback")]
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
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest("Feedback message is required");

            await _feedbackService.SendFeedbackAsync(dto);

            return Ok(new { message = "Feedback sent successfully" });
        }
    }
}
