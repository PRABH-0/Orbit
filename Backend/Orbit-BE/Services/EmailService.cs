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

            if (smtp == null || string.IsNullOrEmpty(smtp["Host"]))
                throw new Exception("SMTP configuration missing from environment variables.");

            try
            {
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
            catch (SmtpException smtpEx)
            {
                throw new Exception(
                    $"SMTP Exception: {smtpEx.Message} | StatusCode: {smtpEx.StatusCode} | Inner: {smtpEx.InnerException?.Message}"
                );
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"General Exception: {ex.Message} | Inner: {ex.InnerException?.Message}"
                );
            }
        }

    }
}
