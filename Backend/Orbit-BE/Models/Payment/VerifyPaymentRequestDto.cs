namespace Orbit_BE.Models.Payment
{
    public class VerifyPaymentRequestDto
    {
        public Guid PaymentId { get; set; }

        public string GatewayPaymentId { get; set; } = null!;
    }

}
