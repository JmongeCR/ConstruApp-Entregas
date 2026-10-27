using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.Infrastructure.Repositories;

public sealed class CotizacionIARepository(AppDbContext context) : Repository<CotizacionIA>(context), ICotizacionIARepository
{
    public IQueryable<CotizacionIA> QueryWithDetails() => _dbSet.AsNoTracking()
        .Include(c => c.Proyecto).ThenInclude(p => p.Cliente).Include(c => c.Lineas);
}
