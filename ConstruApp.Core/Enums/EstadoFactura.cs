namespace ConstruApp.Core.Enums;

public enum EstadoFactura
{
    Borrador,      // En preparación, aún no enviada al cliente
    Enviada,       // Enviada, pendiente de pago
    PagoParcial,   // Tiene pagos pero no está saldada
    Pagada,        // Saldada completamente
    Vencida,       // Superó la fecha de vencimiento sin pago completo
    Cancelada,     // Anulada por el constructor
}
