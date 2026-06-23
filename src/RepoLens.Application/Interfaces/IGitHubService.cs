using System.Threading.Tasks;
using RepoLens.Application.Models;

namespace RepoLens.Application.Interfaces;

public interface IGitHubService
{
    Task<GitHubRepositoryInfo?> GetRepositoryAsync(string owner, string repositoryName);
    Task<string> GetReadmeAsync(string owner, string repo);
    Task<string> GetRepositoryCodeAsync(string owner, string repo);
}