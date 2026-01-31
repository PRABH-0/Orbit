namespace Orbit_BE.Models.NodeModels
{
    public class NodeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? ParentId { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public string? BasePath { get; set; }
    }
}
