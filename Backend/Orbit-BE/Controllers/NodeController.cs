using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Interface;
using Orbit_BE.Models.NodeModels;
using System.Security.Claims;

namespace Orbit_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NodeController : ControllerBase
    {
        private readonly INodeService _nodeService;

        public NodeController(INodeService nodeService)
        {
            _nodeService = nodeService;
        }

        // =========================
        // CREATE NODE
        // =========================
        [HttpPost]
        public async Task<IActionResult> CreateNode([FromBody] CreateNodeDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var node = await _nodeService.CreateNodeAsync(dto, userId);
            return Ok(node);
        }

        // =========================
        // GET ALL USER NODES
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetUserNodes()
        {
            var userId = GetUserIdFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var nodes = await _nodeService.GetUserNodesAsync(userId);
            return Ok(nodes);
        }

        // =========================
        // GET NODE BY ID
        // =========================
        [HttpGet("{nodeId:guid}")]
        public async Task<IActionResult> GetNodeById(Guid nodeId)
        {
            var userId = GetUserIdFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var node = await _nodeService.GetNodeByIdAsync(nodeId, userId);
            if (node == null)
                return NotFound();

            return Ok(node);
        }

        // =========================
        // UPDATE NODE POSITION
        // =========================
        [HttpPut("{nodeId:guid}/position")]
        public async Task<IActionResult> UpdateNodePosition(
            Guid nodeId,
            [FromBody] UpdateNodePositionDto dto)
        {
            var userId = GetUserIdFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var updated = await _nodeService.UpdateNodePositionAsync(nodeId, userId, dto);
            if (!updated)
                return NotFound();

            return NoContent();
        }

        // =========================
        // DELETE NODE (SOFT DELETE)
        // =========================
        [HttpDelete("{nodeId:guid}")]
        public async Task<IActionResult> DeleteNode(Guid nodeId)
        {
            var userId = GetUserIdFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var deleted = await _nodeService.DeleteNodeAsync(nodeId, userId);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        // =========================
        // HELPER: GET USER ID FROM JWT
        // =========================
        private Guid GetUserIdFromToken()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst("sub");

            return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId)
                ? userId
                : Guid.Empty;
        }
    }
}
