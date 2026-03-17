class CreateConsulta < ActiveRecord::Migration[8.1]
  def change
    create_table :consulta do |t|
      t.references :user, null: false, foreign_key: true
      t.text :pregunta
      t.text :respuesta

      t.timestamps
    end
  end
end
