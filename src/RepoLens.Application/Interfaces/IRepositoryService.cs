using RepoLens.Application.DTOs.Requests;
using RepoLens.Application.DTOs.Responses;
using RepoLens.Domain.Entities;

namespace RepoLens.Application.Interfaces;

public interface IRepositoryService
{
    Task<Repository> AddRepositoryAsync(
        AddRepositoryRequest request);

    Task<List<RepositoryResponse>> GetAllRepositoriesAsync();

    Task<RepositoryResponse?> GetRepositoryByIdAsync(
        Guid id);

    Task<Repository?> GetRepositoryEntityByIdAsync(
        Guid id);

    Task<List<AnalysisResult>> GetRepositoryHistoryAsync(
        Guid repositoryId);
}