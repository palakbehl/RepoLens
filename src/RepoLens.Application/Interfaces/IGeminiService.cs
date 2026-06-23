using RepoLens.Application.DTOs.Responses;
namespace RepoLens.Application.Interfaces;

public interface IGeminiService
{
    Task<GeminiReviewResponse> GenerateReviewAsync(string repositoryName,string owner,string language,string readmeContent);
}
// this will be used to generate a review for a repository using Gemini API. It will take the repository name, owner, primary language and readme content as input and return a review as output.