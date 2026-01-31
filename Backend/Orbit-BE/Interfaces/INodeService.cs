using Orbit_BE.Models.NodeModels;

namespace Orbit_BE.Interface
{
    public interface INodeService
    {
        Task<NodeDto> CreateNodeAsync(CreateNodeDto dto, Guid userId);

        Task<List<NodeDto>> GetUserNodesAsync(Guid userId);

        Task<NodeDto?> GetNodeByIdAsync(Guid nodeId, Guid userId);

        Task<bool> UpdateNodePositionAsync(Guid nodeId, Guid userId, UpdateNodePositionDto dto);

        Task<bool> DeleteNodeAsync(Guid nodeId, Guid userId);
    }
}
