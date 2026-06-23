using Microsoft.Extensions.DependencyInjection;
using RepoLens.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RepoLens.Infrastructure.Persistence;
using RepoLens.Infrastructure.GitHub;
using RepoLens.Infrastructure.Services;
namespace RepoLens.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegisteration
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration) // this line is the method signature for the extension method that adds infrastructure services to the dependency injection container. It takes an IServiceCollection as a parameter and returns the modified IServiceCollection after adding the necessary services.
    // the configuration object allows us to read connection string in appsettings.json.
    {
        services.AddHttpClient(); // This line registers the HttpClient service, which is used for making HTTP requests. It allows the application to use HttpClient for communication with external APIs, such as GitHub in this case.
        services.AddScoped<IGitHubService, GitHubService>(); // This line registers the IGitHubService interface and its implementation GitHubService with a scoped lifetime. This means that a new instance of GitHubService will be created for each HTTP request, and the same instance will be used throughout the request. The IGitHubService interface defines the contract for interacting with GitHub, and the GitHubService class provides the actual implementation of that contract.
                                                             // ASP.NET sees:
        services.AddScoped<
    IRepositoryService,
    RepositoryService>();

    services.AddScoped<IAnalysisService,AnalysisService>();        // Needs IGitHubService

services.AddScoped<
    IGeminiService,
    GeminiService>();
        // Looks in DI container:

        // IGitHubService
        //       ↓
        // GitHubService

        // Creates GitHubService automatically.

        // Injects it.

        services.AddDbContext<AppDbContext>(options => // registers appdbcontext with DI , now asp.net can create it automatically when needed. The options parameter allows us to configure the database context, such as specifying the database provider and connection string.
        {
            options.UseNpgsql( // tells er core that the database provider=Postgresql
                configuration.GetConnectionString("DefaultConnection")
            );
        });
        return services;
    }
}