using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using RepoLens.Application.Interfaces;
using RepoLens.Application.Models;

namespace RepoLens.Infrastructure.GitHub;

public class GitHubService : IGitHubService
{
    private readonly HttpClient _httpClient;

    public GitHubService(HttpClient httpClient, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RepoLensApp");
        
        var token = configuration["GitHub:Token"];
        if (!string.IsNullOrWhiteSpace(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Trim());
        }
    }

    public async Task<GitHubRepositoryInfo?> GetRepositoryAsync(string owner, string repositoryName)
    {
        var url = $"https://api.github.com/repos/{owner}/{repositoryName}";
        var response = await _httpClient.GetAsync(url);
        
        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"GitHub API request failed with status {response.StatusCode}. Details: {errorBody}");
        }
        
        var json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);
        var root = document.RootElement;

        // Parse basic metadata
        var info = new GitHubRepositoryInfo
        {
            GitHubId = root.GetProperty("id").GetInt64(),
            Name = root.GetProperty("name").GetString() ?? "",
            Owner = root.GetProperty("owner").GetProperty("login").GetString() ?? "",
            GitHubUrl = root.GetProperty("html_url").GetString() ?? "",
            PrimaryLanguage = root.TryGetProperty("language", out var langProp) ? langProp.GetString() : null,
            Stars = root.GetProperty("stargazers_count").GetInt32(),
            Forks = root.GetProperty("forks_count").GetInt32(),
            IssueCount = root.GetProperty("open_issues_count").GetInt32(),
            RepositoryCreatedAt = root.TryGetProperty("created_at", out var createdProp) ? createdProp.GetDateTime() : DateTime.UtcNow.AddYears(-2)
        };

        // Fetch Contributor Count using Link header page counting (very lightweight)
        info.ContributorCount = await FetchContributorCountAsync(owner, repositoryName);

        // Fetch Commit Frequency (commits per week over last 30 commits)
        info.CommitFrequency = await FetchCommitFrequencyAsync(owner, repositoryName);

        // Detect Tech Stack & Frameworks from file trees
        var (techStack, frameworks) = await DetectStackAndFrameworksAsync(owner, repositoryName);
        info.TechnologyStack = techStack;
        info.Frameworks = frameworks;

        return info;
    }

    public async Task<string> GetReadmeAsync(string owner, string repo)
    {
        var url = $"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md";
        try
        {
            return await _httpClient.GetStringAsync(url);
        }
        catch
        {
            try
            {
                var fallbackUrl = $"https://raw.githubusercontent.com/{owner}/{repo}/master/README.md";
                return await _httpClient.GetStringAsync(fallbackUrl);
            }
            catch
            {
                return "README not found";
            }
        }
    }

    public async Task<string> GetRepositoryCodeAsync(string owner, string repo)
    {
        string[] branchesToTry = { "main", "master" };
        HttpResponseMessage? treeResponse = null;
        string activeBranch = "main";

        foreach (var branch in branchesToTry)
        {
            var treeUrl = $"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1";
            var request = new HttpRequestMessage(HttpMethod.Get, treeUrl);
            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                treeResponse = response;
                activeBranch = branch;
                break;
            }
        }

        if (treeResponse == null)
        {
            return "Source code not accessible or repository is empty.";
        }

        var treeJson = await treeResponse.Content.ReadAsStringAsync();
        using JsonDocument treeDoc = JsonDocument.Parse(treeJson);
        var treeRoot = treeDoc.RootElement;

        if (!treeRoot.TryGetProperty("tree", out var treeElement) || treeElement.ValueKind != JsonValueKind.Array)
        {
            return "Source code directory tree is empty.";
        }

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".cs", ".js", ".jsx", ".ts", ".tsx", ".json"
        };

        var ignoredFolders = new[]
        {
            "node_modules/", "bin/", "obj/", "dist/", "build/", "coverage/", "vendor/", ".git/", ".vs/"
        };

        var importantFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "README.md", "package.json", "appsettings.json", "Program.cs", "Startup.cs"
        };

        var filePathsToFetch = new List<string>();

        foreach (var item in treeElement.EnumerateArray())
        {
            if (item.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "blob" &&
                item.TryGetProperty("path", out var pathProp))
            {
                var path = pathProp.GetString();
                if (string.IsNullOrWhiteSpace(path)) continue;

                bool isIgnored = false;
                foreach (var ignored in ignoredFolders)
                {
                    if (path.StartsWith(ignored, StringComparison.OrdinalIgnoreCase) || 
                        path.Contains("/" + ignored, StringComparison.OrdinalIgnoreCase))
                    {
                        isIgnored = true;
                        break;
                    }
                }
                if (isIgnored) continue;

                var filename = System.IO.Path.GetFileName(path);
                var ext = System.IO.Path.GetExtension(path);

                if (importantFiles.Contains(filename) || allowedExtensions.Contains(ext))
                {
                    filePathsToFetch.Add(path);
                }
            }
        }

        // Prioritize: Configs/Entry files first, then rest. Take max 10 files
        var prioritizedFiles = filePathsToFetch
            .OrderBy(p => !importantFiles.Contains(System.IO.Path.GetFileName(p)))
            .Take(10)
            .ToList();

        var codeBuilder = new System.Text.StringBuilder();

        foreach (var path in prioritizedFiles)
        {
            var rawUrl = $"https://raw.githubusercontent.com/{owner}/{repo}/{activeBranch}/{path}";
            try
            {
                var rawContent = await _httpClient.GetStringAsync(rawUrl);
                if (!string.IsNullOrWhiteSpace(rawContent))
                {
                    if (rawContent.Length > 15000)
                    {
                        rawContent = rawContent.Substring(0, 15000) + "\n...[File truncated due to size limits]...";
                    }
                    
                    codeBuilder.AppendLine($"=== File: {path} ===");
                    codeBuilder.AppendLine(rawContent);
                    codeBuilder.AppendLine("=====================\n");
                }
            }
            catch
            {
                // Skip file if download fails
            }
        }

        return codeBuilder.ToString();
    }

    private async Task<int> FetchContributorCountAsync(string owner, string repo)
    {
        try
        {
            // Request 1 per page to count pages via Link header
            var url = $"https://api.github.com/repos/{owner}/{repo}/contributors?per_page=1";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode) return 1;

            if (response.Headers.TryGetValues("Link", out var linkValues))
            {
                var linkHeader = linkValues.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(linkHeader))
                {
                    // Regex to extract page count from &page=XX>; rel="last"
                    var match = Regex.Match(linkHeader, @"page=(\d+)>;\s*rel=""last""");
                    if (match.Success && int.TryParse(match.Groups[1].Value, out var totalContributors))
                    {
                        return totalContributors;
                    }
                }
            }

            // Fallback: parse list if small (no Link header)
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetArrayLength();
        }
        catch
        {
            return 1;
        }
    }

    private async Task<double> FetchCommitFrequencyAsync(string owner, string repo)
    {
        try
        {
            var url = $"https://api.github.com/repos/{owner}/{repo}/commits?per_page=20";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return 0.5;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var commits = doc.RootElement;
            int count = commits.GetArrayLength();

            if (count <= 1) return count;

            // Get date of newest commit and oldest commit in page
            var newestDateStr = commits[0].GetProperty("commit").GetProperty("committer").GetProperty("date").GetString();
            var oldestDateStr = commits[count - 1].GetProperty("commit").GetProperty("committer").GetProperty("date").GetString();

            if (DateTime.TryParse(newestDateStr, out var newestDate) && DateTime.TryParse(oldestDateStr, out var oldestDate))
            {
                double totalDays = (newestDate - oldestDate).TotalDays;
                if (totalDays > 0)
                {
                    double frequency = (double)count / totalDays * 7.0; // commits per week
                    return Math.Round(frequency, 2);
                }
            }
            return 1.0;
        }
        catch
        {
            return 0.5;
        }
    }

    private async Task<(string TechStack, string Frameworks)> DetectStackAndFrameworksAsync(string owner, string repo)
    {
        var techList = new List<string>();
        var frameworkList = new List<string>();

        // Try getting trees on main/master
        string[] branches = { "main", "master" };
        string treeJson = string.Empty;

        foreach (var b in branches)
        {
            try
            {
                treeJson = await _httpClient.GetStringAsync($"https://api.github.com/repos/{owner}/{repo}/git/trees/{b}?recursive=1");
                break;
            }
            catch {}
        }

        if (string.IsNullOrWhiteSpace(treeJson))
        {
            return ("Unknown", "None Detected");
        }

        using var doc = JsonDocument.Parse(treeJson);
        if (!doc.RootElement.TryGetProperty("tree", out var treeElement))
        {
            return ("Unknown", "None Detected");
        }

        var files = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in treeElement.EnumerateArray())
        {
            if (item.TryGetProperty("path", out var pProp))
            {
                var path = pProp.GetString();
                if (!string.IsNullOrWhiteSpace(path))
                {
                    files.Add(path);
                }
            }
        }

        // Analyze file signatures
        bool hasCs = files.Any(f => f.EndsWith(".cs", StringComparison.OrdinalIgnoreCase));
        bool hasJs = files.Any(f => f.EndsWith(".js", StringComparison.OrdinalIgnoreCase) || f.EndsWith(".jsx", StringComparison.OrdinalIgnoreCase));
        bool hasTs = files.Any(f => f.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) || f.EndsWith(".tsx", StringComparison.OrdinalIgnoreCase));
        bool hasPy = files.Any(f => f.EndsWith(".py", StringComparison.OrdinalIgnoreCase));
        bool hasJava = files.Any(f => f.EndsWith(".java", StringComparison.OrdinalIgnoreCase));
        bool hasPhp = files.Any(f => f.EndsWith(".php", StringComparison.OrdinalIgnoreCase));

        // Tech stack detection
        if (hasCs) techList.Add("C#");
        if (hasJs || hasTs) techList.Add("JavaScript/TypeScript");
        if (hasPy) techList.Add("Python");
        if (hasJava) techList.Add("Java");
        if (hasPhp) techList.Add("PHP");

        // Framework detection
        if (files.Any(f => f.EndsWith("package.json", StringComparison.OrdinalIgnoreCase)))
        {
            frameworkList.Add("Node.js");
        }
        if (files.Any(f => f.Contains("appsettings.json") || f.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase)))
        {
            frameworkList.Add("ASP.NET Core");
        }
        if (files.Any(f => f.Contains("vite.config", StringComparison.OrdinalIgnoreCase)))
        {
            frameworkList.Add("Vite");
        }
        if (files.Any(f => f.Contains("next.config", StringComparison.OrdinalIgnoreCase)))
        {
            frameworkList.Add("Next.js");
        }
        if (files.Any(f => f.Contains("requirements.txt") || f.Contains("manage.py")))
        {
            frameworkList.Add("Django/Flask");
        }
        if (files.Any(f => f.Contains("pom.xml") || f.Contains("build.gradle")))
        {
            frameworkList.Add("Spring Boot");
        }

        var finalTech = techList.Count > 0 ? string.Join(", ", techList) : "Other";
        var finalFrameworks = frameworkList.Count > 0 ? string.Join(", ", frameworkList) : "None Detected";

        return (finalTech, finalFrameworks);
    }
}