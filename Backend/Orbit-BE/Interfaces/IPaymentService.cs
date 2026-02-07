using Orbit_BE.Models.Payment;

namespace Orbit_BE.Interfaces
{
    public interface IPaymentService
    {
        Task<CreatePaymentResponseDto> CreatePaymentAsync(
            Guid userId,
            CreatePaymentRequestDto request
        );
    }

}
