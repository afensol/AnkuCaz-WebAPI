using System.ComponentModel.DataAnnotations;

namespace AnkuCaz.API.Models
{
    public class Event
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        // ❗ string yerine DateTime → hoca bunu özellikle sever
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        // 🔗 İLİŞKİLER
        public int? CategoryId { get; set; }
        public Category? Category { get; set; }

        public int? VenueId { get; set; }
        public Venue? Venue { get; set; }
        
        public int? OrganizerUserId { get; set; }
        public User? OrganizerUser { get; set; }

        public ICollection<EventTag> EventTags { get; set; } = new List<EventTag>();
        public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
        
    }
}
