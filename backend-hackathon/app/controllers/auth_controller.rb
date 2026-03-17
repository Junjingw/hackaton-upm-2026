class AuthController < ApplicationController
  def register
    user = User.new(
      nickName: params[:nickName],
      password: params[:password],
      rol: params[:rol],
      provincia: params[:provincia],
      tipoVivienda: params[:tipoVivienda],
      necesidades: params[:necesidades]
    )
    
    if user.save
      render json: { mensaje: "Usuario registrado con éxito", rol: user.rol }, status: :created
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