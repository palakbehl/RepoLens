namespace RepoLens.Domain.Entities;

public class Repository
{
    public ICollection<AnalysisResult> AnalysisResults { get; set; }
    = new List<AnalysisResult>(); // 1 repository can have multiple analysis results , so we are using collection of analysis results
    public Guid Id { get; set; }
    
    public Guid UserId { get; set; } // foreign key to User and is used to maintain reslationship between User and Repository , because one user can have multiple repositories , so we are using foreign key to maintain relationship between User and Repository
    public User User { get; set; } = null!; // navigation property , to get user name , user email etc , using userId we can get only id , no other details , !null because we are using foreign key to maintain relationship between User and Repository , so we can get user details using userId , that is why we are using !null to avoid null reference exception
    public long GithubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public String Owner { get; set; } = string.Empty;
    public string GithubUrl { get; set; } = string.Empty;
    public string PrimaryLanguage { get; set; } = string.Empty;

    public int Stars { get; set; }

    public int Forks { get; set; }

    public DateTime CreatedAt { get; set; }

    public int ContributorCount { get; set; }

    public int IssueCount { get; set; }

    public double CommitFrequency { get; set; }

    public string TechnologyStack { get; set; } = string.Empty;

    public string Frameworks { get; set; } = string.Empty;

    public DateTime? RepositoryCreatedAt { get; set; }
}