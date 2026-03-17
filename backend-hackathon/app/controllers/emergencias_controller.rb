require 'net/http'
require 'uri'
require 'json'

class EmergenciasController < ApplicationController
  UPM_API_URL = "http://ec2-54-171-51-31.eu-west-1.compute.amazonaws.com"
  
  # PEGA AQUÍ TU TOKEN DE LA UPM:
  UPM_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJKdW5qaW5nIiwiZXhwIjoxNzczODIzMzIyfQ._8PrdlBa2aZbBoeKu2yQ1Z6wZZAyO1z_THTjj_R6DmQ"

  def obtener_datos
    # 1. Buscamos al ciudadano en nuestra Base de Datos
    user = User.find_by(nickName: params[:nickName])
    return render json: { error: "Usuario no encontrado" }, status: :not_found if user.nil?

    begin
      token = UPM_BEARER_TOKEN

      # 2. Obtenemos el clima (Usamos disaster=true para probar que la alerta funciona)
      clima_data = fetch_weather(token, true)

      # 3. PROMPT ENGINEERING: Construimos las instrucciones para la IA
      necesidades_array = user.necesidades.select { |k, v| v == "true" || v == true }.keys
      necesidades_str = necesidades_array.any? ? "Tiene estas necesidades especiales: #{necesidades_array.join(', ')}." : "No tiene necesidades especiales."

      system_prompt = "Eres un experto en emergencias climáticas. Tu objetivo es salvar vidas. " \
                      "Da instrucciones CORTAS, DIRECTAS y CLARAS a un ciudadano. " \
                      "PERFIL DEL CIUDADANO: Vive en la provincia de #{user.provincia}, en un/a #{user.tipoVivienda.gsub('_', ' ')}. " \
                      "#{necesidades_str} " \
                      "REGLAS: Adapta tu consejo estrictamente a su tipo de vivienda y movilidad. Si vive en un sótano y hay lluvia extrema, dile que suba. No des consejos genéricos."

      user_prompt = "El reporte meteorológico actual es: #{clima_data.to_json}. ¿Qué debo hacer para ponerme a salvo en este momento?"

      # 4. Enviamos a la IA
      llm_response = fetch_llm_prompt(token, system_prompt, user_prompt)

      # 5. Devolvemos todo a React
      render json: {
        clima: clima_data,
        recomendacion: llm_response,
        prompt_usado: system_prompt
      }, status: :ok

    rescue StandardError => e
      render json: { error: "Error con la UPM: #{e.message}" }, status: :internal_server_error
    end
  end

  private

  def fetch_weather(token, disaster)
    uri = URI("#{UPM_API_URL}/weather?disaster=#{disaster}")
    req = Net::HTTP::Get.new(uri)
    req['Authorization'] = "Bearer #{token}"
    
    res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
    JSON.parse(res.body)
  end

  def fetch_llm_prompt(token, sys_prompt, usr_prompt)
    uri = URI("#{UPM_API_URL}/prompt")
    req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{token}")
    req.body = { system_prompt: sys_prompt, user_prompt: usr_prompt }.to_json
    
    res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
    JSON.parse(res.body)
  end
end