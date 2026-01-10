using AnkuCaz.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Data
{
    public class AnkuCazContext : DbContext
    {
        public AnkuCazContext(DbContextOptions<AnkuCazContext> options) : base(options) { }

        public DbSet<Event> Events => Set<Event>();
        public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();

        // Projede kalsın istiyorsan:
        public DbSet<Announcement> Announcements => Set<Announcement>();
        public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<EventRegistration>()
                .HasOne(r => r.Event)
                .WithMany()
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // Aynı event’e aynı email bir daha kayıt olamasın
            modelBuilder.Entity<EventRegistration>()
                .HasIndex(r => new { r.EventId, r.Email })
                .IsUnique();
        }
    }
}
