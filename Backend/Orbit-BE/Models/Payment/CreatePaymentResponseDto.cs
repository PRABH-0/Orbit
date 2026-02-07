namespace Orbit_BE.Models.Payment
{
    public class CreatePaymentResponseDto
    {
        public Guid PaymentId { get; set; }
        public string CheckoutUrl { get; set; } = null!;
    }

}
