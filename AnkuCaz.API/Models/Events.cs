using System.ComponentModel.DataAnnotations;

namespace AnkuCaz.API.Models
{
    public class Event
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string LocationName { get; set; } = string.Empty;

        [Required, MaxLength(400)]
        public string LocationAddress { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        [MaxLength(2000)]
        public string? Description { get; set; }
    }
}
