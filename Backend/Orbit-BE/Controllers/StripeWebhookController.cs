using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Entities;
using Orbit_BE.UnitOfWork;
using Stripe;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/webhooks/stripe")]
    public class StripeWebhookController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IUnitOfWork _unitOfWork;

        public StripeWebhookController(IConfiguration config, IUnitOfWork unitOfWork)
        {
            _config = config;
            _unitOfWork = unitOfWork;
        }

        [HttpPost]
        public async Task<IActionResult> Handle()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();

            var stripeEvent = Stripe.EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"],
                _config["Stripe:WebhookSecret"]
            );

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                var paymentId = Guid.Parse(session.Metadata["paymentId"]);

                var payment = await _unitOfWork.Payments
                    .FirstOrDefaultAsync(p => p.Id == paymentId);

                if (payment == null || payment.Status == "Success")
                    return Ok();

                payment.Status = "Success";
                payment.StripePaymentIntentId = session.PaymentIntentId;
                payment.VerifiedAt = DateTime.UtcNow;

                var userPlan = await _unitOfWork.UserPlans
                    .FirstOrDefaultAsync(x => x.UserId == payment.UserId);

                if (userPlan == null)
                {
                    userPlan = new UserPlan
                    {
                        Id = Guid.NewGuid(),
                        UserId = payment.UserId,
                        TotalStorageMb = payment.PurchasedStorageMb,
                        UsedStorageMb = 0
                    };

                    await _unitOfWork.UserPlans.AddAsync(userPlan);
                }
                else
                {
                    userPlan.TotalStorageMb += payment.PurchasedStorageMb;
                    userPlan.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.UserPlans.Update(userPlan);
                }

                _unitOfWork.Payments.Update(payment);
                await _unitOfWork.SaveChangesAsync();
            }

            return Ok();
        }
    }


}
