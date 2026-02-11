using Microsoft.EntityFrameworkCore;
using Orbit_BE.Entities;
using Orbit_BE.Interface;
using Orbit_BE.Models.NodeModels;
using Orbit_BE.Models.Users;
using Orbit_BE.UnitOfWork;
using System.Security.Claims;

namespace Orbit_BE.Services
{
    public class NodeService : INodeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NodeService(IUnitOfWork unitOfWork, IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork; _httpContextAccessor = httpContextAccessor;
        }

        // =========================
        // CREATE NODE
        // =========================
        public async Task<NodeDto> CreateNodeAsync(CreateNodeDto dto, string supabaseUserId)
        {
            var user = await GetOrCreateUserAsync(supabaseUserId);

            var node = new Node
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                UserId = user.Id, // ✅ Guid
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

        public async Task<List<NodeDto>> GetUserNodesAsync(string supabaseUserId)
        {
            var user = await GetOrCreateUserAsync(supabaseUserId);

            var nodes = await _unitOfWork.Nodes
                .GetQueryable()
                .Where(n =>
                    n.UserId == user.Id &&
                    n.RecordState == "Active")
                .Include(n => n.Position)
                .ToListAsync();

            return nodes.Select(MapToDto).ToList();
        }


        // =========================
        // GET NODE BY ID
        // =========================
        public async Task<NodeDto?> GetNodeByIdAsync(Guid nodeId, string supabaseUserId)
        {
            var user = await GetOrCreateUserAsync(supabaseUserId);

            var node = await _unitOfWork.Nodes
                .GetQueryable()
                .Include(n => n.Position)
                .FirstOrDefaultAsync(n =>
                    n.Id == nodeId &&
                    n.UserId == user.Id &&
                    n.RecordState == "Active");

            return node == null ? null : MapToDto(node);
        }

        public async Task<bool> UpdateNodePositionAsync(
      Guid nodeId,
      string supabaseUserId,
      UpdateNodePositionDto dto)
        {
            var user = await GetOrCreateUserAsync(supabaseUserId);

            var node = await _unitOfWork.Nodes
                .GetQueryable()
                .Include(n => n.Position)
                .FirstOrDefaultAsync(n =>
                    n.Id == nodeId &&
                    n.UserId == user.Id &&
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

        public async Task<bool> DeleteNodeAsync(Guid nodeId, string supabaseUserId)
        {
            var user = await GetOrCreateUserAsync(supabaseUserId);

            var node = await _unitOfWork.Nodes.FirstOrDefaultAsync(
                n => n.Id == nodeId &&
                     n.UserId == user.Id &&
                     n.RecordState == "Active");

            if (node == null)
                return false;

            node.RecordState = "Deleted";
            node.LastEditedTimestamp = DateTime.UtcNow;

            _unitOfWork.Nodes.Update(node);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        private async Task<User> GetOrCreateUserAsync(string supabaseUserId)
        {
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Id == Guid.Parse(supabaseUserId)
);

            if (user != null)
                return user;

            user = new User
            {
                Id = Guid.NewGuid(),
                //SupabaseUserId = supabaseUserId,
                CreatedAt = DateTime.UtcNow,
                RecordState = "Active"
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return user;
        }
        public async Task<UserDetilsResponseDto?> GetCurrentUserAsync(string supabaseUserId)
        {
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Id == Guid.Parse(supabaseUserId)
);

            if (user == null)
            {
                var email = GetEmailFromToken();

                if (string.IsNullOrWhiteSpace(email))
                    throw new Exception("Email missing in Supabase token");

                user = new User
                {
                    Id = Guid.NewGuid(),
                    //SupabaseUserId = supabaseUserId,
                    //Email = email,              // ✅ FIX
                    UserStatus = "Online",
                    RecordState = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
            }

            return new UserDetilsResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                //Email = user.Email,
                UserStatus = user.UserStatus,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt
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
