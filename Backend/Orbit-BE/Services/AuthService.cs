using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;
using Snera_Core.Services;

namespace Orbit_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly JwtService _jwtService;

        public AuthService(IUnitOfWork unitOfWork, JwtService jwtService)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
        }

        // =========================
        // REGISTER
        // =========================
        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("All fields are required");
            }

            var existingUser = await _unitOfWork.Users
                .FirstOrDefaultAsync(u =>
                    (u.Username == request.Username || u.Email == request.Email) &&
                    u.RecordState == "Active");

            if (existingUser != null)
                throw new InvalidOperationException("User already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
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

        // =========================
        // LOGIN
        // =========================
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("Email and password are required");
            }

            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == request.Email &&
                    u.RecordState == "Active");

            if (user == null)
                throw new UnauthorizedAccessException("Invalid email or password");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password");

            user.UserStatus = "Online";
            user.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _jwtService.CreateToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                UserStatus = user.UserStatus,
                AccessToken = token
            };
        }

        // =========================
        // USER DETAILS
        // =========================
        public async Task<UserDetilsResponseDto?> GetUserDetailsAsync(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("Invalid user id");

            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            if (user == null || user.RecordState != "Active")
                return null;

            return new UserDetilsResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                UserStatus = user.UserStatus,
                CreatedAt = user.CreatedAt,
                LastEditedTimestamp = user.LastEditedTimestamp
            };
        }

    }
}
