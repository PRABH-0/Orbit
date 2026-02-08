
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Feedback;
using Orbit_BE.Services.Interfaces;

namespace Orbit_BE.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IEmailService _emailService;

        public FeedbackService(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task SendFeedbackAsync(FeedbackDto dto)
        {
            var subject = $"Orbit Feedback | {dto.Type}";

            var body = $"""
            Project: Orbit
            Type: {dto.Type}
            Time: {DateTime.UtcNow}

            Message:
            --------------------
            {dto.Message}
            --------------------
            """;

            await _emailService.SendAsync(subject, body);
        }
    }
}
