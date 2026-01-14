using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Data
{

    public class AnkuCazContext : IdentityDbContext<IdentityUser, IdentityRole, string>
    {
        public AnkuCazContext(DbContextOptions<AnkuCazContext> options) : base(options) { }

        public DbSet<Event> Events => Set<Event>();
        public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();

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

            modelBuilder.Entity<EventRegistration>()
                .HasIndex(r => new { r.EventId, r.Email })
                .IsUnique();
        }
    }
}
