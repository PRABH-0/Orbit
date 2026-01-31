namespace Orbit_BE.Models.NodeModels
{
    public class CreateNodeDto
    {
        public string Name { get; set; } = string.Empty;
        public float X { get; set; }
        public float Y { get; set; }
        public Guid? ParentId { get; set; }
        public string? BasePath { get; set; }
    }
}
