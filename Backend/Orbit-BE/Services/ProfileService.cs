using Microsoft.EntityFrameworkCore;
using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.Profile;
using Orbit_BE.UnitOfWork;
using System.Security.Claims;
using System.Text.Json;

namespace Orbit_BE.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private const long DefaultStorageLimitMb = 100; // Free plan: 100 MB

        public ProfileService(
            IUnitOfWork unitOfWork,
            IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ProfileResponseDto?> GetProfileAsync(string supabaseUserId)
        {
            var userId = Guid.Parse(supabaseUserId);

            // ========================
            // 1. Fetch User
            // ========================
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return null;

            // ========================
            // 2. Extract email from JWT
            // ========================
            var email = GetEmailFromToken();

            // ========================
            // 3. Compute storage usage (live from NodeFiles)
            // ========================
            // Get all node IDs belonging to this user
            var userNodeIds = await _unitOfWork.Nodes
                .GetQueryable()
                .Where(n => n.UserId == userId && n.RecordState == "Active")
                .Select(n => n.Id)
                .ToListAsync();

            // Sum all file sizes across those nodes
            long usedBytes = 0;
            if (userNodeIds.Count > 0)
            {
                usedBytes = await _unitOfWork.NodeFiles
                    .GetQueryable()
                    .Where(f => userNodeIds.Contains(f.NodeId) && f.RecordState == "Active")
                    .SumAsync(f => f.FileSize);
            }

            // ========================
            // 4. Get storage limit from UserPlan
            // ========================
            var userPlan = await _unitOfWork.UserPlans
                .FirstOrDefaultAsync(p => p.UserId == userId);

            long totalStorageMb = userPlan?.TotalStorageMb ?? DefaultStorageLimitMb;
            long totalBytes = totalStorageMb * 1024 * 1024;

            double usagePercentage = totalBytes > 0
                ? Math.Round((double)usedBytes / totalBytes * 100, 2)
                : 0;

            // ========================
            // 5. Compute account stats
            // ========================
            int totalFolders = userNodeIds.Count;

            int totalFiles = 0;
            if (userNodeIds.Count > 0)
            {
                totalFiles = await _unitOfWork.NodeFiles
                    .CountAsync(f => userNodeIds.Contains(f.NodeId) && f.RecordState == "Active");
            }

            string planName = GetPlanName(totalStorageMb);

            // ========================
            // 6. Build response
            // ========================
            return new ProfileResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = email,
                ProfilePictureUrl = user.ProfilePictureUrl,
                CreatedAt = user.CreatedAt,
                UserStatus = user.UserStatus,
                IsAdmin = user.IsAdmin,
                Storage = new StorageUsageDto
                {
                    UsedBytes = usedBytes,
                    TotalBytes = totalBytes,
                    UsagePercentage = usagePercentage
                },
                Stats = new AccountStatsDto
                {
                    TotalFolders = totalFolders,
                    TotalFiles = totalFiles,
                    PlanName = planName
                }
            };
        }

        // =============================
        // HELPERS
        // =============================

        private static string GetPlanName(long totalStorageMb)
        {
            return totalStorageMb switch
            {
                <= 100 => "Free",
                <= 1024 => "Starter",      // up to 1 GB
                <= 10240 => "Pro",          // up to 10 GB
                <= 51200 => "Business",     // up to 50 GB
                _ => "Enterprise"
            };
        }

        private string? GetEmailFromToken()
        {
            return _httpContextAccessor.HttpContext?
                .User?
                .FindFirstValue(ClaimTypes.Email)
                ?? _httpContextAccessor.HttpContext?
                    .User?
                    .FindFirstValue("email");
        }
    }
}
