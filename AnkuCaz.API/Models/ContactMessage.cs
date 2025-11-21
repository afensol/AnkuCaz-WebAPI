namespace AnkuCaz.API.Models
{
    public class ContactMessage
    {
        public int Id { get; set; }                            // PK
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
