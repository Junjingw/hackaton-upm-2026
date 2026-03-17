class AuthController < ApplicationController
  # Clave maestra para el hackathon
  CLAVE_ADMIN_MAESTRA = "UPM_HACK_2026_SECRET"

  def register
    # 1. Validación de seguridad para Administradores
    if params[:rol] == "backoffice"
      if params[:adminToken] != CLAVE_ADMIN_MAESTRA
        return render json: { detail: "Código de autorización incorrecto." }, status: :unauthorized
      end
    end

    # 2. Creación del usuario con todos los campos recuperados
    user = User.new(
      nickName: params[:nickName],
      password: params[:password],
      rol: params[:rol],
      provincia: params[:provincia],
      tipoVivienda: params[:tipoVivienda],
      necesidades: params[:necesidades] # Asegúrate de que esto sea un JSON o texto en tu DB
    )
    
    # 3. Guardado y respuesta
    if user.save
      render json: { 
        mensaje: "Usuario registrado con éxito", 
        usuario: {
          nickName: user.nickName,
          rol: user.rol,
          provincia: user.provincia,
          tipoVivienda: user.tipoVivienda
        }
      }, status: :created
    else
      render json: { detail: user.errors.full_messages.join(', ') }, status: :bad_request
    end
  end

  def login
    user = User.find_by(nickName: params[:nickName])
    
    if user && user.authenticate(params[:password])
      render json: {
        mensaje: "Login correcto",
        usuario: {
          nickName: user.nickName,
          rol: user.rol,
          provincia: user.provincia,
          tipoVivienda: user.tipoVivienda,
          necesidades: user.necesidades
        }
      }, status: :ok
    else
      render json: { detail: "Usuario o contraseña incorrectos" }, status: :unauthorized
    end
  end
end