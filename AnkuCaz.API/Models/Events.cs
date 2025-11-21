namespace AnkuCaz.API.Models
{
    public class Event
    {
        public int Id { get; set; }                       
        public string Title { get; set; } = string.Empty;  
        public string Date { get; set; } = string.Empty;   
        public string Location { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
