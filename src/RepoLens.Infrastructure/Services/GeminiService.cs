using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RepoLens.Application.DTOs.Responses;
using RepoLens.Application.Interfaces;

namespace RepoLens.Infrastructure.Services;

public class GeminiService : IGeminiService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IGitHubService _gitHubService;

    public GeminiService(IConfiguration configuration, IHttpClientFactory httpClientFactory, IGitHubService gitHubService)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _gitHubService = gitHubService;
    }

    public async Task<GeminiReviewResponse> GenerateReviewAsync(string repositoryName, string owner, string language, string readmeContent)
    {
        var openRouterKey = _configuration["OpenRouterSettings:ApiKey"];
        var geminiKey = _configuration["GeminiSettings:ApiKey"];
        
        bool useOpenRouter = !string.IsNullOrWhiteSpace(openRouterKey) || 
                             (!string.IsNullOrWhiteSpace(geminiKey) && geminiKey.StartsWith("sk-or-"));
                             
        var apiKey = useOpenRouter ? openRouterKey ?? geminiKey : geminiKey;
        var modelName = useOpenRouter 
            ? _configuration["OpenRouterSettings:Model"] ?? "cohere/north-mini-code:free" 
            : _configuration["GeminiSettings:Model"] ?? "gemini-2.5-flash";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("AI Review API key is not configured. Add 'OpenRouterSettings:ApiKey' to appsettings.json.");
        }

        // Fetch actual codebase source files (Phase 1 & 2)
        var codebase = await _gitHubService.GetRepositoryCodeAsync(owner, repositoryName);

        var prompt = $@"You are a senior software architect and security auditor.
Analyze the following source code files from the repository '{owner}/{repositoryName}' (written primarily in {language}):

{codebase}

Perform a comprehensive repository intelligence code review and return a JSON object matching the following structure. Do NOT wrap the JSON in markdown code blocks like ```json ... ```. Return ONLY the raw JSON string:
{{
  ""OverallReview"": ""A high-level summary of the codebase quality, architecture choices, and general assessment."",
  ""CodeSmells"": ""A concise analysis of code smells (e.g. monolithic classes, nested loops, duplicate logic) found in the files."",
  ""SecurityIssues"": ""A detailed review of security vulnerabilities, secret exposures, or unsafe operations detected in configurations or source files."",
  ""ArchitectureObservations"": ""Detailed architectural feedback, highlighting separation of concerns, pattern usage, and layer structures."",
  ""RefactoringSuggestions"": ""Actionable recommendations for refactoring and modularizing the code."",
  ""MaintainabilityRecommendations"": ""Strategic advice for improving test coverage, package structures, and documentation quality."",
  ""RiskLevel"": ""High"" // Choose exactly one of: Low, Medium, High
}}";

        var client = _httpClientFactory.CreateClient();
        string rawText = string.Empty;

        if (useOpenRouter)
        {
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            client.DefaultRequestHeaders.Add("HTTP-Referer", "https://repolens.com");
            client.DefaultRequestHeaders.Add("X-Title", "RepoLens");

            var payload = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            using var response = await client.PostAsJsonAsync("https://openrouter.ai/api/v1/chat/completions", payload);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException(
                    $"OpenRouter request failed with status {(int)response.StatusCode} ({response.ReasonPhrase}). {errorBody}");
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);
            rawText = ExtractOpenRouterText(document) ?? string.Empty;
        }
        else
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={Uri.EscapeDataString(apiKey)}";
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            using var response = await client.PostAsJsonAsync(url, payload);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException(
                    $"Gemini request failed with status {(int)response.StatusCode} ({response.ReasonPhrase}). {errorBody}");
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);
            rawText = ExtractGeminiText(document) ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new GeminiReviewResponse
            {
                OverallReview = "No review was returned by the AI provider.",
                RiskLevel = "Low"
            };
        }

        try
        {
            var cleanJson = CleanJsonString(rawText);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
                ReadCommentHandling = JsonCommentHandling.Skip
            };
            var parsedResponse = JsonSerializer.Deserialize<GeminiReviewResponse>(cleanJson, options);

            if (parsedResponse != null)
            {
                return parsedResponse;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to parse AI structured JSON with JsonSerializer: {ex.Message}");
            Console.WriteLine("Attempting regex-based field extraction fallback...");
        }

        // Fallback: manual regex extraction if JsonSerializer failed (e.g. unescaped inner quotes or trailing commas)
        try
        {
            var cleanJson = CleanJsonString(rawText);
            
            var response = new GeminiReviewResponse
            {
                OverallReview = ExtractField(cleanJson, "OverallReview"),
                CodeSmells = ExtractField(cleanJson, "CodeSmells"),
                SecurityIssues = ExtractField(cleanJson, "SecurityIssues"),
                ArchitectureObservations = ExtractField(cleanJson, "ArchitectureObservations"),
                RefactoringSuggestions = ExtractField(cleanJson, "RefactoringSuggestions"),
                MaintainabilityRecommendations = ExtractField(cleanJson, "MaintainabilityRecommendations"),
                RiskLevel = ExtractField(cleanJson, "RiskLevel")
            };

            // Supply defaults for empty fields to maintain clean card rendering
            if (string.IsNullOrWhiteSpace(response.OverallReview)) response.OverallReview = "Overall review could not be parsed.";
            if (string.IsNullOrWhiteSpace(response.CodeSmells)) response.CodeSmells = "No specific code smells observed.";
            if (string.IsNullOrWhiteSpace(response.SecurityIssues)) response.SecurityIssues = "No specific security issues observed.";
            if (string.IsNullOrWhiteSpace(response.ArchitectureObservations)) response.ArchitectureObservations = "No specific architectural observations recorded.";
            if (string.IsNullOrWhiteSpace(response.RefactoringSuggestions)) response.RefactoringSuggestions = "No specific refactoring suggestions recorded.";
            if (string.IsNullOrWhiteSpace(response.MaintainabilityRecommendations)) response.MaintainabilityRecommendations = "No specific maintainability recommendations recorded.";
            if (string.IsNullOrWhiteSpace(response.RiskLevel)) response.RiskLevel = "Medium";

            // If we successfully extracted any core reviews, return it
            if (response.OverallReview != "Overall review could not be parsed." || response.CodeSmells != "No specific code smells observed.")
            {
                return response;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Regex JSON extraction fallback failed: {ex.Message}");
        }

        // Fallback response if both parsing methods failed
        return new GeminiReviewResponse
        {
            OverallReview = rawText,
            CodeSmells = "Failed to parse structured code smells section. View details in Overall Review.",
            SecurityIssues = "Failed to parse structured security issues section. View details in Overall Review.",
            ArchitectureObservations = "Failed to parse structured architecture section. View details in Overall Review.",
            RefactoringSuggestions = "Failed to parse structured refactoring suggestions. View details in Overall Review.",
            MaintainabilityRecommendations = "Failed to parse structured maintainability suggestions. View details in Overall Review.",
            RiskLevel = "Medium"
        };
    }

    private static string ExtractField(string json, string fieldName)
    {
        // Matches "fieldName" : "value" where value can contain unescaped quotes,
        // stopping only at the quote before a comma and another known field or the closing brace.
        var pattern = $@"(?s)(?i)""?{fieldName}""?\s*:\s*""(.*?)""(?=\s*,?\s*""?(?:OverallReview|CodeSmells|SecurityIssues|ArchitectureObservations|RefactoringSuggestions|MaintainabilityRecommendations|RiskLevel)""?\s*:|\s*\}})";
        var match = System.Text.RegularExpressions.Regex.Match(json, pattern);
        if (match.Success)
        {
            var value = match.Groups[1].Value;
            try
            {
                // Unescape standard JSON/C# escape sequences (e.g. \n, \u2011)
                return System.Text.RegularExpressions.Regex.Unescape(value);
            }
            catch
            {
                return value;
            }
        }
        return string.Empty;
    }

    private static string? ExtractOpenRouterText(JsonDocument document)
    {
        if (!document.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
        {
            return null;
        }

        var message = choices[0].GetProperty("message");
        if (!message.TryGetProperty("content", out var content))
        {
            return null;
        }

        return content.GetString();
    }

    private static string? ExtractGeminiText(JsonDocument document)
    {
        if (!document.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var content = candidates[0].GetProperty("content");
        var parts = content.GetProperty("parts");
        if (parts.GetArrayLength() == 0)
        {
            return null;
        }

        return parts[0].GetProperty("text").GetString();
    }

    private static string CleanJsonString(string rawText)
    {
        var trimmed = rawText.Trim();
        
        // Find the index of the first '{' and the last '}'
        int firstBrace = trimmed.IndexOf('{');
        int lastBrace = trimmed.LastIndexOf('}');
        
        if (firstBrace >= 0 && lastBrace > firstBrace)
        {
            return trimmed.Substring(firstBrace, lastBrace - firstBrace + 1);
        }
        
        return trimmed;
    }
}