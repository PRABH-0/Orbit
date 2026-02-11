using Microsoft.EntityFrameworkCore.Storage;
using Orbit_BE.Data;
using Orbit_BE.Entities;
using Orbit_BE.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Orbit_BE.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DataContext _context;
        private readonly Dictionary<Type, object> _repositories = new();
        private IDbContextTransaction? _transaction;

        public UnitOfWork(DataContext context)
        {
            _context = context;
        }

        // =========================
        // Generic Repository
        // =========================
        public IRepository<T> Repository<T>() where T : class
        {
            if (!_repositories.ContainsKey(typeof(T)))
            {
                _repositories[typeof(T)] = new Repository<T>(_context);
            }

            return (IRepository<T>)_repositories[typeof(T)];
        }

        // =========================
        // Explicit Repositories
        // =========================
        private IRepository<User>? _users;
        public IRepository<User> Users =>
            _users ??= Repository<User>();

        private IRepository<Node>? _nodes;
        public IRepository<Node> Nodes =>
            _nodes ??= Repository<Node>();

        private IRepository<NodePosition>? _nodePositions;
        public IRepository<NodePosition> NodePositions =>
            _nodePositions ??= Repository<NodePosition>();

        private IRepository<NodeFile>? _nodeFiles;
        public IRepository<NodeFile> NodeFiles =>
            _nodeFiles ??= Repository<NodeFile>();

        private IRepository<CanvasEdge>? _canvasEdges;
        public IRepository<CanvasEdge> CanvasEdges =>
            _canvasEdges ??= Repository<CanvasEdge>();


        private IRepository<Payment>? _payments;
        public IRepository<Payment> Payments =>
            _payments ??= Repository<Payment>();

        private IRepository<UserPlan>? _userPlan;
        public IRepository<UserPlan> UserPlans =>
            _userPlan ??= Repository<UserPlan>();

        // =========================
        // Transaction Methods
        // =========================
        public async Task BeginTransactionAsync()
        {
            if (_transaction == null)
                _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        // =========================
        // Save Methods
        // =========================
        public async Task<int> SaveAllAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        // =========================
        // Dispose
        // =========================
        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
