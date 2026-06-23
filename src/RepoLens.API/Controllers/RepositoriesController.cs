using Microsoft.AspNetCore.Mvc;
using RepoLens.Application.DTOs.Requests;
using RepoLens.Application.Interfaces;

namespace RepoLens.API.Controllers;

[ApiController]
[Route("api/repositories")]
public class RepositoriesController : ControllerBase
{
    private readonly IRepositoryService _repositoryService;
    private readonly IAnalysisService _analysisService;


    private readonly IGeminiService _geminiService;


    public RepositoriesController(IRepositoryService repositoryService,IAnalysisService analysisService,IGeminiService geminiService)
    {
        _repositoryService = repositoryService;
        _analysisService=analysisService;
        _geminiService=geminiService;
    }
    [HttpPost]
    public async Task<IActionResult> AddRepository(
        AddRepositoryRequest request
    )
    {
        var repository=await _repositoryService.AddRepositoryAsync(request);
        return Ok(repository);
    }

    [HttpGet]
public async Task<IActionResult>
    GetAllRepositories()
{
    var repositories =
        await _repositoryService
            .GetAllRepositoriesAsync();

    return Ok(repositories);
}
// the above method is an HTTP GET endpoint that retrieves a list of all repositories. It calls the GetAllRepositoriesAsync method of the IRepositoryService to fetch the data and returns it in the response with an HTTP 200 OK status.

    [HttpGet("{id}")]
    public async Task<IActionResult>
        GetRepositoryById(Guid id)
    {
        var repository =
            await _repositoryService
                .GetRepositoryByIdAsync(id);

        if (repository == null)
        {
            return NotFound();
        }

        return Ok(repository);
    }
    // the above method is an HTTP GET endpoint that retrieves a specific repository by its unique identifier (id). It calls the GetRepositoryByIdAsync method of the IRepositoryService to fetch the repository data. If the repository is not found (i.e., null), it returns an HTTP 404 Not Found response. Otherwise, it returns the repository data with an HTTP 200 OK status.

    [HttpGet("{id}/analysis")]
public async Task<IActionResult>
    GetLatestAnalysis(Guid id)
{
    var analysis =
        await _analysisService
            .GetLatestAnalysisAsync(id);

    if (analysis == null)
    {
        return NotFound();
    }

    return Ok(analysis);
}
// the above method is an HTTP GET endpoint that retrieves the latest analysis result for a specific repository identified by its unique identifier (id). It calls the GetLatestAnalysisAsync method of the IAnalysisService to fetch the analysis data. If no analysis is found (i.e., null), it returns an HTTP 404 Not Found response. Otherwise, it returns the latest analysis data with an HTTP 200 OK status.

    [HttpGet("{id}/history")]
public async Task<IActionResult>
    GetHistory(Guid id)
{
    var history =
        await _repositoryService
            .GetRepositoryHistoryAsync(id);

    return Ok(history);
}

[HttpPost("{id:guid}/review")]
public async Task<IActionResult>
    GenerateReview(Guid id)
{
    var repository =
        await _repositoryService
            .GetRepositoryByIdAsync(id);

    if (repository == null)
    {
        return NotFound();
    }

    try
    {
        var review =
            await _geminiService
                .GenerateReviewAsync(
                    repository.Name,
                    repository.Owner,
                    repository.PrimaryLanguage ?? string.Empty,
                    repository.Name);

        return Ok(review);
    }
    catch (InvalidOperationException ex) when (
        ex.Message.Contains("status 429", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("Too Many Requests", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("quota", StringComparison.OrdinalIgnoreCase))
    {
        return StatusCode(StatusCodes.Status429TooManyRequests, new
        {
            message = "AI review could not be generated.",
            details = ex.Message
        });
    }
}

[HttpPost("{id:guid}/analyze")]
public async Task<IActionResult> AnalyzeRepository(Guid id)
{
    var repository = await _repositoryService.GetRepositoryEntityByIdAsync(id);
    if (repository == null)
    {
        return NotFound();
    }

    var result = await _analysisService.AnalyzeRepositoryAsync(repository);
    return Ok(result);
}
}
