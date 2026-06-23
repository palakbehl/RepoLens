namespace RepoLens.Domain.Entities;
public class User
{
    public ICollection<Repository> Repositories { get; set; }
    = new List<Repository>(); // 1 user can have multiple repositories , so we are using collection of repositories
    public Guid Id {get; set;}
    public string Name {get;set;}=string.Empty;
    public string Email {get;set;}=string.Empty;
    public string PasswordHash {get;set;}=string.Empty;
    public DateTime CreatedAt { get; set; }
}