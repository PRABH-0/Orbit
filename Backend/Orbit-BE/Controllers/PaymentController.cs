using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Payment;
using System.Security.Claims;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        // =========================
        // CREATE PAYMENT (START CHECKOUT)
        // =========================
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] CreatePaymentRequestDto request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst("sub");

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var result = await _paymentService.CreatePaymentAsync(userId, request);

            return Ok(result);
        }
    }
}
