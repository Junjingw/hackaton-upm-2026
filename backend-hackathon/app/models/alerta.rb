# app/models/alerta.rb
class Alerta < ApplicationRecord
  # Esto le dice a Rails: "No intentes adivinar, la tabla se llama alerta"
  self.table_name = "alerta" 
end