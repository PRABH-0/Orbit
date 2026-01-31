using Microsoft.EntityFrameworkCore;
using Orbit_BE.Entities;
using Orbit_BE.Interface;
using Orbit_BE.Models.NodeModels;
using Orbit_BE.UnitOfWork;

namespace Orbit_BE.Services
{
    public class NodeService : INodeService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NodeService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // =========================
        // CREATE NODE
        // =========================
        public async Task<NodeDto> CreateNodeAsync(CreateNodeDto dto, Guid userId)
        {
            var node = new Node
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                UserId = userId,
                ParentId = dto.ParentId,
                BasePath = dto.BasePath,
                RecordState = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var position = new NodePosition
            {
                Id = Guid.NewGuid(),
                NodeId = node.Id,
                X = dto.X,
                Y = dto.Y,
                RecordState = "Active",
                CreatedAt = DateTime.UtcNow
            };

            node.Position = position;

            await _unitOfWork.Nodes.AddAsync(node);
            await _unitOfWork.NodePositions.AddAsync(position);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(node);
        }

        // =========================
        // GET ALL USER NODES
        // =========================
        public async Task<List<NodeDto>> GetUserNodesAsync(Guid userId)
        {
            var nodes = await _unitOfWork.Nodes
                .GetQueryable()
                .Where(n =>
                    n.UserId == userId &&
                    n.RecordState == "Active")
                .Include(n => n.Position)
                .ToListAsync();

            return nodes.Select(MapToDto).ToList();
        }

        // =========================
        // GET NODE BY ID
        // =========================
        public async Task<NodeDto?> GetNodeByIdAsync(Guid nodeId, Guid userId)
        {
            var node = await _unitOfWork.Nodes
                .GetQueryable()
                .Include(n => n.Position)
                .FirstOrDefaultAsync(n =>
                    n.Id == nodeId &&
                    n.UserId == userId &&
                    n.RecordState == "Active");

            return node == null ? null : MapToDto(node);
        }

        // =========================
        // UPDATE NODE POSITION
        // =========================
        public async Task<bool> UpdateNodePositionAsync(
            Guid nodeId,
            Guid userId,
            UpdateNodePositionDto dto)
        {
            var node = await _unitOfWork.Nodes
                .GetQueryable()
                .Include(n => n.Position)
                .FirstOrDefaultAsync(n =>
                    n.Id == nodeId &&
                    n.UserId == userId &&
                    n.RecordState == "Active");

            if (node?.Position == null)
                return false;

            node.Position.X = dto.X;
            node.Position.Y = dto.Y;
            node.Position.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.NodePositions.Update(node.Position);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        // =========================
        // SOFT DELETE NODE
        // =========================
        public async Task<bool> DeleteNodeAsync(Guid nodeId, Guid userId)
        {
            var node = await _unitOfWork.Nodes.FirstOrDefaultAsync(
                n => n.Id == nodeId &&
                     n.UserId == userId &&
                     n.RecordState == "Active");

            if (node == null)
                return false;

            node.RecordState = "Deleted";
            node.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Nodes.Update(node);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        // =========================
        // MAPPER
        // =========================
        private static NodeDto MapToDto(Node node)
        {
            return new NodeDto
            {
                Id = node.Id,
                Name = node.Name,
                ParentId = node.ParentId,
                X = node.Position?.X ?? 0,
                Y = node.Position?.Y ?? 0,
                BasePath = node.BasePath
            };
        }
    }
}
