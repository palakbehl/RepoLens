namespace RepoLens.Application.DTOs.Responses;

public class GeminiReviewResponse
{
    public string OverallReview { get; set; } = string.Empty;
    public string CodeSmells { get; set; } = string.Empty;
    public string SecurityIssues { get; set; } = string.Empty;
    public string ArchitectureObservations { get; set; } = string.Empty;
    public string RefactoringSuggestions { get; set; } = string.Empty;
    public string MaintainabilityRecommendations { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "Low"; // Low, Medium, High
}