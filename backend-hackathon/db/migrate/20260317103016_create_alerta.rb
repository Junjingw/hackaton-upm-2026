class CreateAlerta < ActiveRecord::Migration[8.1]
  def change
    create_table :alerta do |t|
      t.string :mensaje
      t.string :tipo
      t.string :provincia

      t.timestamps
    end
  end
end
