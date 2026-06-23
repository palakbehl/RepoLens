using RepoLens.Application.DTOs.Requests;
using RepoLens.Application.Interfaces;
using RepoLens.Domain.Entities;
using RepoLens.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using RepoLens.Application.DTOs.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RepoLens.Infrastructure.Services;

public class RepositoryService : IRepositoryService
{
    private readonly IGitHubService _gitHubService;
    private readonly AppDbContext _dbContext;
    private readonly IAnalysisService _analysisService;

    public RepositoryService(IGitHubService gitHubService, AppDbContext context, IAnalysisService analysisService)
    {
        _gitHubService = gitHubService;
        _dbContext = context;
        _analysisService = analysisService;
    }

    public async Task<List<RepositoryResponse>> GetAllRepositoriesAsync()
    {
        return await _dbContext.Repositories
            .Select(r => new RepositoryResponse
            {
                Id = r.Id,
                Name = r.Name,
                Owner = r.Owner,
                GitHubUrl = r.GithubUrl,
                PrimaryLanguage = r.PrimaryLanguage,
                Stars = r.Stars,
                Forks = r.Forks,
                
                // Map new intelligence properties
                ContributorCount = r.ContributorCount,
                IssueCount = r.IssueCount,
                CommitFrequency = r.CommitFrequency,
                TechnologyStack = r.TechnologyStack,
                Frameworks = r.Frameworks,
                RepositoryCreatedAt = r.RepositoryCreatedAt
            })
            .ToListAsync();
    }

    public async Task<RepositoryResponse?> GetRepositoryByIdAsync(Guid id)
    {
        return await _dbContext.Repositories
            .Where(r => r.Id == id)
            .Select(r => new RepositoryResponse
            {
                Id = r.Id,
                Name = r.Name,
                Owner = r.Owner,
                GitHubUrl = r.GithubUrl,
                PrimaryLanguage = r.PrimaryLanguage,
                Stars = r.Stars,
                Forks = r.Forks,
                
                // Map new intelligence properties
                ContributorCount = r.ContributorCount,
                IssueCount = r.IssueCount,
                CommitFrequency = r.CommitFrequency,
                TechnologyStack = r.TechnologyStack,
                Frameworks = r.Frameworks,
                RepositoryCreatedAt = r.RepositoryCreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<Repository?> GetRepositoryEntityByIdAsync(Guid id)
    {
        return await _dbContext.Repositories
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<List<AnalysisResult>> GetRepositoryHistoryAsync(Guid repositoryId)
    {
        return await _dbContext.AnalysisResults
            .Where(a => a.RepositoryId == repositoryId)
            .OrderByDescending(a => a.AnalyzedAt)
            .ToListAsync();
    }

    public async Task<Repository> AddRepositoryAsync(AddRepositoryRequest request)
    {
        var uri = new Uri(request.GitHubUrl);
        var owner = uri.Segments[1].Trim('/');
        var repo = uri.Segments[2].Trim('/');
        
        if (repo.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
        {
            repo = repo.Substring(0, repo.Length - 4);
        }
        
        var githubRepo = await _gitHubService.GetRepositoryAsync(owner, repo);
        if (githubRepo == null)
        {
            throw new Exception("Repository not found on GitHub.");
        }

        var repository = new Repository
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            GithubId = githubRepo.GitHubId,
            Name = githubRepo.Name,
            Owner = githubRepo.Owner,
            GithubUrl = githubRepo.GitHubUrl,
            PrimaryLanguage = githubRepo.PrimaryLanguage ?? "",
            Stars = githubRepo.Stars,
            Forks = githubRepo.Forks,
            CreatedAt = DateTime.UtcNow,

            // Populate intelligence properties
            ContributorCount = githubRepo.ContributorCount,
            IssueCount = githubRepo.IssueCount,
            CommitFrequency = githubRepo.CommitFrequency,
            TechnologyStack = githubRepo.TechnologyStack,
            Frameworks = githubRepo.Frameworks,
            RepositoryCreatedAt = githubRepo.RepositoryCreatedAt
        };

        _dbContext.Repositories.Add(repository);
        await _dbContext.SaveChangesAsync();
        
        // Analyze repository
        await _analysisService.AnalyzeRepositoryAsync(repository);
        
        return repository;
    }
}