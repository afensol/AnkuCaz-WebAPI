namespace AnkuCaz.API.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;

    public ICollection<Event> Events { get; set; } = new List<Event>();
}
