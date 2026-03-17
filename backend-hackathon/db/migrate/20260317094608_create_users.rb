class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :nickName
      t.string :password_digest
      t.string :rol
      t.string :provincia
      t.string :tipoVivienda
      t.json :necesidades

      t.timestamps
    end
  end
end
