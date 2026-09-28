using ConstruApp.API.DTOs.Usuario;
using ConstruApp.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly UserManager<Usuario> _userManager;

    public UsuariosController(UserManager<Usuario> userManager)
        => _userManager = userManager;

    // GET api/usuarios
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UsuarioResponse>>> GetAll()
    {
        var users = await _userManager.Users.ToListAsync();
        return Ok(users.Select(Map));
    }

    // GET api/usuarios/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> GetById(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        return Ok(Map(user));
    }

    // PUT api/usuarios/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UsuarioUpdateRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        if (request.Nombre is not null) user.Nombre = request.Nombre;
        if (request.Telefono is not null) user.Telefono = request.Telefono;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return NoContent();
    }

    // DELETE api/usuarios/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return NoContent();
    }

    private static UsuarioResponse Map(Usuario u) => new()
    {
        Id = u.Id, Nombre = u.Nombre, Email = u.Email!,
        Telefono = u.Telefono, Rol = u.Rol, CreatedAt = u.CreatedAt
    };
}
