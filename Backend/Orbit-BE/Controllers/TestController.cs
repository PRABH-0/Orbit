using Microsoft.AspNetCore.Mvc;
using Orbit_BE.UnitOfWork;

namespace Orbit_BE.Controllers
{
    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public TestController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet("db")]
        public async Task<IActionResult> TestDatabase()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            return Ok(users);
        }
    }
}
