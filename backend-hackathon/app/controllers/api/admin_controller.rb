# app/controllers/api/admin_controller.rb
def alertar
  mensaje = params[:mensaje]
  
  # Guardamos en DB (opcional)
  Alerta.create(mensaje: mensaje)

  # BROADCAST: Envía el mensaje a TODOS los conectados al instante
  ActionCable.server.broadcast("emergencias_channel", { 
    mensaje: mensaje,
    fecha: Time.now 
  })

  render json: { status: "Alerta emitida" }
end