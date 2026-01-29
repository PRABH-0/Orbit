using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Orbit_BE.Repositories
{
    public interface IRepository<T> where T : class
    {
        // Queryable (important for flexible queries)
        IQueryable<T> GetQueryable();

        // Get all
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> GetAllAsync(Expression<Func<T, bool>> predicate);

        // Get single
        Task<T?> GetByIdAsync(Guid id);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<T?> SingleOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<T> FirstAsync(Expression<Func<T, bool>> predicate);
        Task<T> SingleAsync(Expression<Func<T, bool>> predicate);

        // Add
        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);

        // Update / Delete
        void Update(T entity);
        void Delete(T entity);

        // Helpers
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
        Task<int> CountAsync();
        Task<int> CountAsync(Expression<Func<T, bool>> predicate);
        Task<long> LongCountAsync();
        Task<long> LongCountAsync(Expression<Func<T, bool>> predicate);
    }
}
