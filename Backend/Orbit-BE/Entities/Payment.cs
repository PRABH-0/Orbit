namespace Orbit_BE.Entities
{
    public class Payment
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }

        public long PurchasedStorageMb { get; set; } // 10240, 20480 etc
        public decimal Amount { get; set; }

        public string Status { get; set; } = "Created"; // Created | Pending | Success | Failed

        public string GatewayName { get; set; } = "Stripe";
        public string? StripeSessionId { get; set; }
        public string? StripePaymentIntentId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? VerifiedAt { get; set; }
    }


}
