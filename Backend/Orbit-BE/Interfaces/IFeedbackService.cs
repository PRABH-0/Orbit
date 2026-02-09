
using Orbit_BE.Models.Feedback;

namespace Orbit_BE.Services.Interfaces
{
    public interface IFeedbackService
    {
        Task SendFeedbackAsync(FeedbackDto dto, string? userEmail);
    }
}
