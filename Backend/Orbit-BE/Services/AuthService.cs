using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;

namespace Orbit_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AuthService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            var existingUser = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username
                                       && u.RecordState == "Active");

            if (existingUser != null)
                throw new Exception("User already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserStatus = "Offline",
                IsAdmin = false,
                RecordState = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username
                                       && u.RecordState == "Active");

            if (user == null)
                throw new Exception("Invalid credentials");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new Exception("Invalid credentials");

            user.UserStatus = "Online";
            user.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus
            };
        }

        public async Task UpdateUserStatusAsync(Guid userId, string status)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null) return;

            user.UserStatus = status;
            user.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }

}
