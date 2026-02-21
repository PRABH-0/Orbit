namespace Orbit_BE.Models.Node
{
    public class UpdateGoogleNodePositionDto
    {
        public string ExternalId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public float X { get; set; }
        public float Y { get; set; }
    }
}
