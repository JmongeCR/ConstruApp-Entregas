using ConstruApp.Core.Entities;

namespace ConstruApp.Core.Interfaces;

public interface ICotizacionIARepository : IRepository<CotizacionIA>
{
    IQueryable<CotizacionIA> QueryWithDetails();
}
