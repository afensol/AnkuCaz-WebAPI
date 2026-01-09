namespace AnkuCaz.API.Models
{
    public class EventRegistration
    {
        public int Id { get; set; }

        public int EventId { get; set; }   // Foreign key

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Event? Event { get; set; }
    }
}
