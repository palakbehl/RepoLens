using System;

namespace RepoLens.Application.DTOs.Responses;
public class RepositoryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public string GitHubUrl { get; set; } = string.Empty;
    public string? PrimaryLanguage { get; set; }
    public int Stars { get; set; }
    public int Forks { get; set; }

    // Repository Intelligence columns
    public int ContributorCount { get; set; }
    public int IssueCount { get; set; }
    public double CommitFrequency { get; set; }
    public string TechnologyStack { get; set; } = string.Empty;
    public string Frameworks { get; set; } = string.Empty;
    public DateTime? RepositoryCreatedAt { get; set; }
}