using AnkuCaz.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Data
{
    public class AnkuCazContext : DbContext
    {
        public AnkuCazContext(DbContextOptions<AnkuCazContext> options) : base(options)
        {
        }

        public DbSet<Event> Events => Set<Event>();
        public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    }
}
