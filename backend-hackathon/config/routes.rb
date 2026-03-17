#Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
# get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
#end

Rails.application.routes.draw do
  post '/api/registro', to: 'auth#register'
  post '/api/login', to: 'auth#login'
  
  # Nueva ruta para pedir los datos de emergencia
  get '/api/emergencias/:nickName', to: 'emergencias#obtener_datos'
  # Rutas para el Administrador
  get '/api/admin/clima', to: 'backoffice#clima_general'
  post '/api/admin/alertar', to: 'backoffice#emitir_alerta'
  get '/api/admin/historial', to: 'backoffice#historial_alertas'
  
  # Ruta para que el ciudadano vea la última alerta oficial
  get '/api/alerta_oficial', to: 'backoffice#historial_alertas'
end