using Microsoft.AspNetCore.Mvc;
using RepoLens.Application.Interfaces;
namespace RepoLens.API.Controllers;
[ApiController]
[Route("api/github")]
public class GitHubController : ControllerBase
{
    private readonly IGitHubService _gitHubService;
    public GitHubController(
        IGitHubService gitHubService
    )
    {
        _gitHubService=gitHubService;
    }
    [HttpGet("{owner}/{repo}")]
    public async Task<IActionResult> GetRepository(
        string owner,string repo
    )
    {
        var result=await _gitHubService.GetRepositoryAsync(
            owner,repo
        );
        if(result==null) return NotFound();
        return Ok(result);
    }
}