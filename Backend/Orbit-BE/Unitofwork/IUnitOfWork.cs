using Orbit_BE.Entities;
using Orbit_BE.Repositories;
using System;
using System.Threading.Tasks;

namespace Orbit_BE.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<User> Users { get; }
        IRepository<Node> Nodes { get; }
        IRepository<NodePosition> NodePositions { get; }
        IRepository<NodeFile> NodeFiles { get; }
        IRepository<CanvasEdge> CanvasEdges { get; }

        IRepository<RefreshToken> RefreshTokens { get; }

        IRepository<T> Repository<T>() where T : class;

        Task<int> SaveAllAsync();
        Task<int> SaveChangesAsync();

        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
