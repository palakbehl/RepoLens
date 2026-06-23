namespace RepoLens.Domain.Entities;

public class AnalysisResult
{
    public Repository Repository { get; set; } = null!; // navigation property , to get repo name , repo owner etc , using repositoryId we can get only id , no other details
    public Guid Id { get; set; }
    public Guid RepositoryId { get; set; } // foreign key to Repository and is used to maintain reslationship between Repository and AnalysisResult
    public int DocumentationScore { get; set; }
    public int ComplexityScore { get; set; }
    public int ActivityScore { get; set; }
    public int HealthScore { get; set; }
    public DateTime AnalyzedAt { get; set; }

}