using Microsoft.EntityFrameworkCore;
using Orbit_BE.Entities;

namespace Orbit_BE.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Node> Nodes { get; set; }
        public DbSet<NodePosition> NodePositions { get; set; }
        public DbSet<NodeFile> NodeFiles { get; set; }
        public DbSet<CanvasEdge> CanvasEdges { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<UserPlan> UserPlans { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // TABLE NAME MAPPING
            // ========================
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Node>().ToTable("nodes");
            modelBuilder.Entity<NodePosition>().ToTable("node_positions");
            modelBuilder.Entity<NodeFile>().ToTable("node_files");
            modelBuilder.Entity<CanvasEdge>().ToTable("canvas_edges");
            modelBuilder.Entity<Payment>().ToTable("payments");
            modelBuilder.Entity<UserPlan>().ToTable("user_plans");

            // ========================
            // RELATIONSHIPS
            // ========================

            modelBuilder.Entity<Node>()
                .HasOne(n => n.User)
                .WithMany(u => u.Nodes)
                .HasForeignKey(n => n.UserId);

            modelBuilder.Entity<Node>()
                .HasOne(n => n.Parent)
                .WithMany(n => n.Children)
                .HasForeignKey(n => n.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<NodePosition>()
                .HasOne(p => p.Node)
                .WithOne(n => n.Position)
                .HasForeignKey<NodePosition>(p => p.NodeId);

            modelBuilder.Entity<NodeFile>()
                .HasOne(f => f.Node)
                .WithMany(n => n.Files)
                .HasForeignKey(f => f.NodeId);

            modelBuilder.Entity<CanvasEdge>()
                .HasOne(e => e.FromNode)
                .WithMany()
                .HasForeignKey(e => e.FromNodeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CanvasEdge>()
                .HasOne(e => e.ToNode)
                .WithMany()
                .HasForeignKey(e => e.ToNodeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<UserPlan>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(10, 2);
        }
    }
}
