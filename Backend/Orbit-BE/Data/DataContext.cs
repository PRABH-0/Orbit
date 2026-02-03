using Microsoft.EntityFrameworkCore;
using Orbit_BE.Entities;
using System.Xml.Linq;

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
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Self-referencing Node (Parent → Children)
            modelBuilder.Entity<Node>()
                .HasOne(n => n.Parent)
                .WithMany(n => n.Children)
                .HasForeignKey(n => n.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // One-to-One: Node → Position
            modelBuilder.Entity<NodePosition>()
                .HasOne(p => p.Node)
                .WithOne(n => n.Position)
                .HasForeignKey<NodePosition>(p => p.NodeId);

            // Canvas edges (self references)
            modelBuilder.Entity<CanvasEdge>()
                .HasOne(e => e.FromNode)
                .WithMany()
                .HasForeignKey(e => e.FromNodeId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<RefreshToken>()
    .HasOne(rt => rt.User)
    .WithMany(u => u.RefreshTokens)
    .HasForeignKey(rt => rt.UserId);

            modelBuilder.Entity<CanvasEdge>()
                .HasOne(e => e.ToNode)
                .WithMany()
                .HasForeignKey(e => e.ToNodeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
