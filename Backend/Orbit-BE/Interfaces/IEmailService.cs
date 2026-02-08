namespace Orbit_BE.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendAsync(string subject, string body);
    }
}
