using System;
using System.Linq;
using System.Threading.Tasks;
using RepoLens.Application.Interfaces;
using RepoLens.Application.DTOs.Responses;
using RepoLens.Domain.Entities;
using RepoLens.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace RepoLens.Infrastructure.Services;

public class AnalysisService : IAnalysisService
{
    private readonly AppDbContext _context;
    private readonly IGitHubService _gitHubService;

    public AnalysisService(AppDbContext context, IGitHubService gitHubService)
    {
        _context = context;
        _gitHubService = gitHubService;
    }

    public async Task<AnalysisResult> AnalyzeRepositoryAsync(Repository repository)
    {
        // 1. Documentation Analysis (Phase 5)
        var documentationScore = await CalculateDocumentationScoreAsync(repository);

        // 2. Better Activity Analysis (Phase 6)
        var activityScore = CalculateActivityScore(repository);

        // 3. Source Code Complexity Analysis (Phase 1)
        var complexityScore = await CalculateComplexityScoreAsync(repository);

        // 4. Health Score Calculation
        var healthScore = (int)((activityScore * 0.40) + (documentationScore * 0.30) + (complexityScore * 0.30));
        healthScore = Math.Clamp(healthScore, 0, 100);

        var analysisResult = new AnalysisResult
        {
            Id = Guid.NewGuid(),
            RepositoryId = repository.Id,
            DocumentationScore = documentationScore,
            ActivityScore = activityScore,
            ComplexityScore = complexityScore,
            HealthScore = healthScore,
            AnalyzedAt = DateTime.UtcNow
        };

        _context.AnalysisResults.Add(analysisResult);
        await _context.SaveChangesAsync();
        return analysisResult;
    }

    public async Task<AnalysisResultResponse?> GetLatestAnalysisAsync(Guid repositoryId)
    {
        var latest = await _context.AnalysisResults
            .Where(a => a.RepositoryId == repositoryId)
            .OrderByDescending(a => a.AnalyzedAt)
            .FirstOrDefaultAsync();

        if (latest is null)
        {
            return null;
        }

        // We need repository metadata to explain scores
        var repo = await _context.Repositories.FindAsync(repositoryId);
        if (repo == null) return null;

        var docDetails = GetDocumentationExplanation(latest.DocumentationScore);
        var compDetails = GetComplexityExplanation(latest.ComplexityScore);
        var actDetails = GetActivityExplanation(latest.ActivityScore, repo);
        var healthDetails = GetHealthExplanation(latest.HealthScore, latest.ActivityScore, latest.DocumentationScore, latest.ComplexityScore);

        return new AnalysisResultResponse
        {
            DocumentationScore = latest.DocumentationScore,
            ComplexityScore = latest.ComplexityScore,
            ActivityScore = latest.ActivityScore,
            HealthScore = latest.HealthScore,
            AnalyzedAt = latest.AnalyzedAt,
            
            DocumentationDetails = docDetails,
            ComplexityDetails = compDetails,
            ActivityDetails = actDetails,
            HealthDetails = healthDetails
        };
    }

    private async Task<int> CalculateDocumentationScoreAsync(Repository repository)
    {
        var readme = await _gitHubService.GetReadmeAsync(repository.Owner, repository.Name);
        if (string.IsNullOrWhiteSpace(readme) || readme.Equals("README not found", StringComparison.OrdinalIgnoreCase))
        {
            return 10;
        }

        int score = 20; // Base score for README file presence
        var lowerReadme = readme.ToLower();

        // Check for Overview
        if (lowerReadme.Contains("overview") || lowerReadme.Contains("about") || lowerReadme.Contains("description") || lowerReadme.Contains("introduction"))
        {
            score += 12;
        }

        // Check for Installation
        if (lowerReadme.Contains("install") || lowerReadme.Contains("setup") || lowerReadme.Contains("prerequisite") || lowerReadme.Contains("getting started"))
        {
            score += 13;
        }

        // Check for Usage Examples
        if (lowerReadme.Contains("usage") || lowerReadme.Contains("run") || lowerReadme.Contains("example") || lowerReadme.Contains("how to use"))
        {
            score += 13;
        }

        // Check for Configuration
        if (lowerReadme.Contains("config") || lowerReadme.Contains("environment") || lowerReadme.Contains("settings") || lowerReadme.Contains(".env"))
        {
            score += 12;
        }

        // Check for Contribution Guidelines
        if (lowerReadme.Contains("contribut") || lowerReadme.Contains("conduct") || lowerReadme.Contains("pr") || lowerReadme.Contains("guideline"))
        {
            score += 12;
        }

        // Check for License
        if (lowerReadme.Contains("license") || lowerReadme.Contains("mit") || lowerReadme.Contains("apache") || lowerReadme.Contains("gpl"))
        {
            score += 13;
        }

        // Bonus points for comprehensive length
        if (readme.Length > 1000)
        {
            score += 5;
        }

        return Math.Clamp(score, 0, 100);
    }

    private int CalculateActivityScore(Repository repository)
    {
        // Stars portion (max 20)
        int starsPart = Math.Min(repository.Stars / 10, 20);

        // Forks portion (max 20)
        int forksPart = Math.Min(repository.Forks / 5, 20);

        // Contributors portion (max 20)
        int contributorsPart = Math.Min(repository.ContributorCount * 4, 20);

        // Commit frequency portion (max 20)
        int commitsPart = Math.Min((int)(repository.CommitFrequency * 4), 20);

        // Open Issues penalty portion (max 20)
        // More open issues reduces this part of the score, but we baseline it.
        int issuesPart = Math.Max(20 - (repository.IssueCount / 5), 0);

        int activityScore = starsPart + forksPart + contributorsPart + commitsPart + issuesPart;
        return Math.Clamp(activityScore, 0, 100);
    }

    private async Task<int> CalculateComplexityScoreAsync(Repository repository)
    {
        var code = await _gitHubService.GetRepositoryCodeAsync(repository.Owner, repository.Name);
        if (string.IsNullOrWhiteSpace(code) || code.Equals("Source code not accessible or repository is empty.", StringComparison.OrdinalIgnoreCase))
        {
            return 50; // Baseline complexity if code is missing
        }

        int baseScore = 95;

        // Count decision points / control structures in source code
        int conditionals = SubstringCount(code, "if (") + SubstringCount(code, "if(");
        int loops = SubstringCount(code, "for (") + SubstringCount(code, "for(") + 
                    SubstringCount(code, "while (") + SubstringCount(code, "while(") +
                    SubstringCount(code, "foreach (") + SubstringCount(code, "foreach(");
        int catches = SubstringCount(code, "catch (") + SubstringCount(code, "catch(");
        int switches = SubstringCount(code, "switch (") + SubstringCount(code, "switch(");

        // Penalize complexity indicators
        baseScore -= (int)(conditionals * 0.5);
        baseScore -= (int)(loops * 1.0);
        baseScore -= (int)(catches * 1.0);
        baseScore -= (int)(switches * 1.5);

        // Size penalty if repository payload is massive
        if (code.Length > 80000)
        {
            baseScore -= 10;
        }

        return Math.Clamp(baseScore, 20, 100);
    }

    private int SubstringCount(string source, string pattern)
    {
        int count = 0;
        int index = 0;
        while ((index = source.IndexOf(pattern, index, StringComparison.Ordinal)) != -1)
        {
            count++;
            index += pattern.Length;
        }
        return count;
    }

    // Explainable scoring helpers (Phase 4)
    private ScoreExplanationDto GetHealthExplanation(int health, int act, int doc, int comp)
    {
        string status = health >= 90 ? "Excellent" : health >= 75 ? "Good" : health >= 50 ? "Needs Improvement" : health >= 25 ? "Poor" : "Critical";
        string exp = health >= 90 ? "Repository health is outstanding. Code maintainability, documentation, and commit rates meet high industry standards." :
                     health >= 75 ? "Repository is in good shape. Core quality practices are observed, and developers maintain a stable release cycle." :
                     health >= 50 ? "Repository quality requires work. Maintainability issues, sparse documentation, or slow activity need attention." :
                     health >= 25 ? "Repository health is poor. High code complexity and low documentation scores present high refactoring risks." :
                     "Repository health is critically low. Technical debt is severe, activity is stagnant, and key configurations are undocumented.";
        
        string reason = $"Health score ({health}/100) is the weighted average of Activity ({act}/100 at 40%), Documentation ({doc}/100 at 30%), and Complexity ({comp}/100 at 30%). " +
                        (act < 50 ? "Critical developer inactivity is dragging down the health rating. " : "") +
                        (doc < 50 ? "Incomplete README configurations require updates. " : "") +
                        (comp < 50 ? "High cyclomatic complexity and class smells reduce code maintainability." : "");
        
        return new ScoreExplanationDto { Value = health, Status = status, Explanation = exp, Reasoning = reason };
    }

    private ScoreExplanationDto GetDocumentationExplanation(int doc)
    {
        string status = doc >= 90 ? "Excellent" : doc >= 75 ? "Good" : doc >= 50 ? "Needs Improvement" : doc >= 25 ? "Poor" : "Critical";
        string exp = doc >= 90 ? "Project documentation is highly comprehensive, covering setup, license, contributions, and configuration." :
                     doc >= 75 ? "Documentation is complete. README lists prerequisite setups and basic project usage steps." :
                     doc >= 50 ? "Documentation is basic. README exists but is missing installation steps, contribution guides, or environment configs." :
                     doc >= 25 ? "Documentation is sparse. Installation guidelines are out of date or completely undocumented." :
                     "Critical documentation deficit. The repository lacks a valid README, license configurations, or setup scripts.";
        
        string reason = $"Documentation score ({doc}/100) evaluates the README for key sections. " +
                        (doc >= 90 ? "All critical sections (Overview, Install, Usage, Config, Contributing, License) were successfully detected." :
                        "Key developer onboarding sections (such as Installation instructions or Contribution Guides) are missing or incomplete.");

        return new ScoreExplanationDto { Value = doc, Status = status, Explanation = exp, Reasoning = reason };
    }

    private ScoreExplanationDto GetComplexityExplanation(int comp)
    {
        string status = comp >= 90 ? "Excellent" : comp >= 75 ? "Good" : comp >= 50 ? "Needs Improvement" : comp >= 25 ? "Poor" : "Critical";
        string exp = comp >= 90 ? "Codebase complexity is exceptionally low. Functions are modular and classes maintain tight single responsibilities." :
                     comp >= 75 ? "Codebase is well structured. Separation of concerns is observed, and nesting depths are minor." :
                     comp >= 50 ? "Code structure appears moderately complex. Classes are growing heavy and some routines require refactoring." :
                     comp >= 25 ? "High codebase complexity. Severe nesting, redundant loops, and duplicate control branches increase technical debt." :
                     "Critical complexity levels. Monolithic class files, nested conditionals, and high smell density severely impair maintainability.";
        
        string reason = $"Complexity score ({comp}/100) measures file structures and cyclomatic paths (if/for/catch blocks). " +
                        (comp >= 75 ? "Low control flow nesting yields high readability." : "High conditional densities and catch structures raise cognitive loads.");

        return new ScoreExplanationDto { Value = comp, Status = status, Explanation = exp, Reasoning = reason };
    }

    private ScoreExplanationDto GetActivityExplanation(int act, Repository repo)
    {
        string status = act >= 90 ? "Excellent" : act >= 75 ? "Good" : act >= 50 ? "Needs Improvement" : act >= 25 ? "Poor" : "Critical";
        string exp = act >= 90 ? "Active repository maintenance. Commit frequency is high, and developer engagement is strong." :
                     act >= 75 ? "Healthy codebase updates. Commits occur regularly and contributors actively maintain releases." :
                     act >= 50 ? "Stagnant activity. Commits occur periodically, but contributor counts or issue closure rates are dropping." :
                     act >= 25 ? "Low codebase activity. Code updates are sparse, and issues are left open for excessive periods." :
                     "Stale codebase. The repository is inactive, showing zero recent commits and long-stagnant issue trackers.";
        
        string reason = $"Activity score ({act}/100) evaluates Stars ({repo.Stars}), Forks ({repo.Forks}), Contributors ({repo.ContributorCount}), " +
                        $"Commit Frequency ({repo.CommitFrequency}/wk), and Open Issues ({repo.IssueCount}).";

        return new ScoreExplanationDto { Value = act, Status = status, Explanation = exp, Reasoning = reason };
    }
}