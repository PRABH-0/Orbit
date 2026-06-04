namespace Orbit_BE.Models.Profile
{
    public class ProfileResponseDto
    {
        // User Info
        public Guid Id { get; set; }
        public string Username { get; set; } = null!;
        public string? Email { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        // Account Status
        public string UserStatus { get; set; } = "Offline";
        public bool IsAdmin { get; set; }

        // Storage Usage
        public StorageUsageDto Storage { get; set; } = null!;

        // Account Stats
        public AccountStatsDto Stats { get; set; } = null!;
    }

    public class StorageUsageDto
    {
        /// <summary>Sum of all NodeFile.FileSize for this user (in bytes).</summary>
        public long UsedBytes { get; set; }

        /// <summary>Total allowed storage in bytes (derived from UserPlan.TotalStorageMb).</summary>
        public long TotalBytes { get; set; }

        /// <summary>Percentage of storage used (0–100).</summary>
        public double UsagePercentage { get; set; }
    }

    public class AccountStatsDto
    {
        /// <summary>Total number of Node (folder) records for this user.</summary>
        public int TotalFolders { get; set; }

        /// <summary>Total number of NodeFile records across all user's nodes.</summary>
        public int TotalFiles { get; set; }

        /// <summary>Plan name derived from storage limit (e.g. "Free", "Pro").</summary>
        public string PlanName { get; set; } = "Free";
    }
}
