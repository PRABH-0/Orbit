using System.Net;
using System.Net.Mail;
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
            var smtp = _config.GetSection("Smtp");

            var client = new SmtpClient(smtp["Host"], int.Parse(smtp["Port"]))
            {
                Credentials = new NetworkCredential(
                    smtp["Username"],
                    smtp["Password"]
                ),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(smtp["From"]),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            mail.To.Add(smtp["Username"]);

            if (!string.IsNullOrWhiteSpace(replyTo))
            {
                mail.ReplyToList.Add(replyTo);
            }

            await client.SendMailAsync(mail);
        }
    }
}
