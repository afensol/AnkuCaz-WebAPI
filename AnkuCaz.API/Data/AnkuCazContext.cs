using AnkuCaz.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Data
{
    public class AnkuCazContext : DbContext
    {
        public AnkuCazContext(DbContextOptions<AnkuCazContext> options)
            : base(options) { }

        public DbSet<Event> Events => Set<Event>();
        public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
        public DbSet<Announcement> Announcements => Set<Announcement>();
        public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();
    
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Venue> Venues => Set<Venue>();

        public DbSet<User> Users => Set<User>();
        public DbSet<Registration> Registrations => Set<Registration>();

        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<EventTag> EventTags => Set<EventTag>();
         public DbSet<StaffApiKey> StaffApiKeys => Set<StaffApiKey>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // EventTag composite key
    modelBuilder.Entity<EventTag>()
        .HasKey(et => new { et.EventId, et.TagId });

    modelBuilder.Entity<EventTag>()
        .HasOne(et => et.Event)
        .WithMany(e => e.EventTags)
        .HasForeignKey(et => et.EventId);

    modelBuilder.Entity<EventTag>()
        .HasOne(et => et.Tag)
        .WithMany(t => t.EventTags)
        .HasForeignKey(et => et.TagId);

    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();

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
