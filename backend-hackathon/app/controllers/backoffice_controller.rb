class BackofficeController < ApplicationController
  # 1. Ver el clima general (como pide el PDF)
  def clima_general
    # Usamos la lógica que ya teníamos pero simplificada para el admin
    emergencia_ctrl = EmergenciasController.new
    token = EmergenciasController::UPM_BEARER_TOKEN
    
    # Pedimos el clima de un lugar genérico o por defecto
    uri = URI("#{EmergenciasController::UPM_API_URL}/weather?disaster=true")
    req = Net::HTTP::Get.new(uri)
    req['Authorization'] = "Bearer #{token}"
    
    res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
    render json: JSON.parse(res.body)
  end

  # 2. Crear y emitir una alerta a todos los ciudadanos
  def emitir_alerta
    alerta = Alerta.new(
      mensaje: params[:mensaje],
      tipo: params[:tipo],
      provincia: params[:provincia]
    )

    if alerta.save
      render json: { mensaje: "Alerta emitida correctamente", alerta: alerta }, status: :created
    else
      render json: { error: "No se pudo emitir la alerta" }, status: :bad_request
    end
  end

  # 3. Listado de todas las alertas emitidas (Historial)
  def historial_alertas
    render json: Alerta.all.order(created_at: :desc)
  end
end


def historial_alertas
  # Esto devuelve todas las alertas, la más reciente primero
  render json: Alerta.all.order(created_at: :desc)
end