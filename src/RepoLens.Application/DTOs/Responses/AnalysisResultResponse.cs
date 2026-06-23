using System;

namespace RepoLens.Application.DTOs.Responses;

public class AnalysisResultResponse
{
    public int DocumentationScore { get; set; }
    public int ComplexityScore { get; set; }
    public int ActivityScore { get; set; }
    public int HealthScore { get; set; }
    public DateTime AnalyzedAt { get; set; }

    // Explainable score structures
    public ScoreExplanationDto DocumentationDetails { get; set; } = new();
    public ScoreExplanationDto ComplexityDetails { get; set; } = new();
    public ScoreExplanationDto ActivityDetails { get; set; } = new();
    public ScoreExplanationDto HealthDetails { get; set; } = new();
}