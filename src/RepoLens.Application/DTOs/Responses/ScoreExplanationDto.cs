namespace RepoLens.Application.DTOs.Responses;

public class ScoreExplanationDto
{
    public int Value { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
}
