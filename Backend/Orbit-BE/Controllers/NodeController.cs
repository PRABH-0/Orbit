using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orbit_BE.Entities;
using Orbit_BE.Interface;
using Orbit_BE.Models.Node;
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

        [HttpPost]
        public async Task<IActionResult> CreateNode(CreateNodeDto dto)
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();

            var node = await _nodeService.CreateNodeAsync(dto, supabaseUserId);
            return Ok(node);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserNodes()
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();

            var nodes = await _nodeService.GetUserNodesAsync(supabaseUserId);
            return Ok(nodes);
        }

        [HttpGet("{nodeId:guid}")]
        public async Task<IActionResult> GetNodeById(Guid nodeId)
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();

            var node = await _nodeService.GetNodeByIdAsync(nodeId, supabaseUserId);
            if (node == null) return NotFound();

            return Ok(node);
        }

        [HttpPut("{nodeId:guid}/position")]
        public async Task<IActionResult> UpdateNodePosition(
            Guid nodeId,
            UpdateNodePositionDto dto)
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();

            var updated = await _nodeService.UpdateNodePositionAsync(nodeId, supabaseUserId, dto);
            if (!updated) return NotFound();

            return NoContent();
        }
        [HttpPut("google/position")]
        public async Task<IActionResult> UpdateGooglePosition(
    UpdateGoogleNodePositionDto dto)
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();


            var result = await _nodeService
                .UpdateOrCreateGoogleNodePositionAsync(
                    dto.ExternalId,
                    dto.Name,
                    supabaseUserId,
                    new UpdateNodePositionDto
                    {
                        X = dto.X,
                        Y = dto.Y
                    });

            return result ? Ok() : BadRequest();
        }

        [HttpDelete("{nodeId:guid}")]
        public async Task<IActionResult> DeleteNode(Guid nodeId)
        {
            var supabaseUserId = GetSupabaseUserId();
            if (supabaseUserId == null) return Unauthorized();

            var deleted = await _nodeService.DeleteNodeAsync(nodeId, supabaseUserId);
            if (!deleted) return NotFound();

            return NoContent();
        }

private string? GetSupabaseUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

}
}
