namespace AnkuCaz.API.Models;

public class Registration
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Status { get; set; } = "registered"; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
