using Microsoft.EntityFrameworkCore;
using RepoLens.Domain.Entities;
namespace RepoLens.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) // This is the constructor for the AppDbContext class. It takes a DbContextOptions<AppDbContext> object as a parameter, which contains the configuration options for the database context. The constructor calls the base class constructor
    // base(options) to pass the options to the DbContext base class, allowing it to initialize the database context with the specified configuration. This setup is necessary for Entity Framework Core to properly configure the database connection and other settings when using the AppDbContext in the application.
    {

    }
    public DbSet<User> Users => Set<User>(); // This tells ER Core to create Users table . This line defines a DbSet property named Users, which represents a collection of User entities in the database. The Set<User>() method is called to create a new DbSet instance for the User entity type. This allows you to perform CRUD operations on the Users table in the database using Entity Framework Core's LINQ queries and other data manipulation methods.
    public DbSet<Repository> Repositories => Set<Repository>(); // This line defines a DbSet property named Repositories, which represents a collection of Repository entities in the database. The Set<Repository>() method is called to create a new DbSet instance for the Repository entity type.
    public DbSet<AnalysisResult> AnalysisResults => Set<AnalysisResult>(); // This line defines a DbSet property named AnalysisResults, which represents a collection of AnalysisResult entities in the database. The Set<AnalysisResult>() method is called to create a new DbSet instance for the AnalysisResult entity type.
}