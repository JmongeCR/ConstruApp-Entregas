using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace ConstruApp.API.Filters;

/// <summary>
/// Verifica que el usuario autenticado tenga el permiso específico.
/// Admin siempre pasa. Usuarios no autenticados → 401. Sin permiso → 403.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequierePermisoAttribute(string permiso) : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Admin siempre tiene acceso total
        var rol = user.FindFirstValue(ClaimTypes.Role) ?? "";
        if (rol == "Admin") return;

        // Verificar en el claim "perms"
        var perms = user.FindFirstValue("perms") ?? "";
        var lista  = perms.Split(',', StringSplitOptions.RemoveEmptyEntries);

        if (!lista.Contains(permiso))
            context.Result = new ObjectResult(new { message = $"No tenés el permiso '{permiso}' para esta acción." })
            {
                StatusCode = 403
            };
    }
}
