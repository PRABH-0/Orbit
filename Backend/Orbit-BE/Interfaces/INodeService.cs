using Orbit_BE.Models.NodeModels;

namespace Orbit_BE.Interface
{
    public interface INodeService
    {
        Task<NodeDto> CreateNodeAsync(CreateNodeDto dto, string userId);

        Task<List<NodeDto>> GetUserNodesAsync(string userId);

        Task<NodeDto?> GetNodeByIdAsync(Guid nodeId, string userId);

        Task<bool> UpdateNodePositionAsync(Guid nodeId, string userId, UpdateNodePositionDto dto);

        Task<bool> DeleteNodeAsync(Guid nodeId, string userId);
    }
}
