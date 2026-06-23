using RepoLens.Domain.Entities;
using RepoLens.Application.DTOs.Responses;
namespace RepoLens.Application.Interfaces;

public interface IAnalysisService
{
    Task<AnalysisResult> AnalyzeRepositoryAsync(Repository repository);
    Task<AnalysisResultResponse?> GetLatestAnalysisAsync(Guid repositoryId);
}