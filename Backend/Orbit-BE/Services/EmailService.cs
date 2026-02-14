using SendGrid;
using SendGrid.Helpers.Mail;
using Orbit_BE.Services.Interfaces;

namespace Orbit_BE.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(
            string subject,
            string body,
            string? replyTo = null
        )
        {
            var apiKey = _config["SendGrid:ApiKey"];
            var fromEmail = _config["SendGrid:FromEmail"];
            var fromName = _config["SendGrid:FromName"];

            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("SendGrid API Key missing.");

            var client = new SendGridClient(apiKey);

            var from = new EmailAddress(fromEmail, fromName);
            var to = new EmailAddress("ps7584153@gmail.com");


            var msg = MailHelper.CreateSingleEmail(
                from,
                to,
                subject,
                body,
                body
            );

            if (!string.IsNullOrWhiteSpace(replyTo))
            {
                msg.ReplyTo = new EmailAddress(replyTo);
            }

            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                throw new Exception($"SendGrid Error: {errorBody}");
            }
        }
    }
}
