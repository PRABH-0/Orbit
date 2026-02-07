using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Payment;
using Orbit_BE.UnitOfWork;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _unitOfWork;

    public PaymentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CreatePaymentResponseDto> CreatePaymentAsync(
        Guid userId,
        CreatePaymentRequestDto request)
    {
        long storageMb;
        long amountInCents;

        switch (request.Plan.ToLower())
        {
            case "10gb":
                storageMb = 10240;
                amountInCents = 500;
                break;

            case "20gb":
                storageMb = 20480;
                amountInCents = 900;
                break;

            default:
                throw new InvalidOperationException("Invalid storage plan");
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PurchasedStorageMb = storageMb,
            Amount = amountInCents / 100m,
            Status = "Created"
        };

        await _unitOfWork.Payments.AddAsync(payment);
        await _unitOfWork.SaveChangesAsync();

        var session = await new Stripe.Checkout.SessionService()
            .CreateAsync(new Stripe.Checkout.SessionCreateOptions
            {
                Mode = "payment",
                PaymentMethodTypes = new() { "card" },
                SuccessUrl = "http://localhost:4200/payment-success",
                CancelUrl = "http://localhost:4200/payment-cancel",
                LineItems = new()
                {
                    new()
                    {
                        Quantity = 1,
                        PriceData = new()
                        {
                            Currency = "usd",
                            UnitAmount = amountInCents,
                            ProductData = new()
                            {
                                Name = $"{storageMb / 1024} GB Storage"
                            }
                        }
                    }
                },
                Metadata = new()
                {
                    { "paymentId", payment.Id.ToString() }
                }
            });

        payment.StripeSessionId = session.Id;
        payment.Status = "Pending";
        _unitOfWork.Payments.Update(payment);
        await _unitOfWork.SaveChangesAsync();

        return new CreatePaymentResponseDto
        {
            PaymentId = payment.Id,
            CheckoutUrl = session.Url
        };
    }
}
