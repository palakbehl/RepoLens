using Microsoft.AspNetCore.Mvc;
using RepoLens.Application.Interfaces;
namespace RepoLens.API.Controllers;
[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IGitHubService _gitHubService;
    public TestController(IGitHubService gitHubService)
    {
        _gitHubService=gitHubService;
    }
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("Dependency Injection Working!");
    }
}