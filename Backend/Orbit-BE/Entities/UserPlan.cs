namespace Orbit_BE.Entities
{
    public class UserPlan
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }

        public long TotalStorageMb { get; set; }

        public long UsedStorageMb { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

}
