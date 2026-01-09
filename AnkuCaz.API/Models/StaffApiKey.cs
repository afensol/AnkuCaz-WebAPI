namespace AnkuCaz.API.Models
{
    public class StaffApiKey
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";      // "Tugrul", "Etkinlik Ekibi" gibi
        public string Role { get; set; } = "viewer"; // admin | organizer | viewer

        public string KeyHash { get; set; } = "";   // SHA256 hash
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
