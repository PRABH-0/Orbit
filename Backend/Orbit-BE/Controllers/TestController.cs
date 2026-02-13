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
            try
            {
                var users = await _unitOfWork.Users.GetAllAsync();
                return Ok(new
                {
                    success = true,
                    message = "Database connected successfully",
                    data = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
