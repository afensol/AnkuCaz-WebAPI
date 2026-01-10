using System.ComponentModel.DataAnnotations;

namespace AnkuCaz.API.Models
{
    public class EventRegistration
    {
        public int Id { get; set; }

        [Required]
        public int EventId { get; set; }

        [Required, MaxLength(120)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(200), EmailAddress]
        public string Email { get; set; } = string.Empty;

        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        public Event? Event { get; set; }
    }
}
