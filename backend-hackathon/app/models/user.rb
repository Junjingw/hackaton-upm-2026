class User < ApplicationRecord
    has_secure_password # Esto hace que encripte la contraseña automáticamente
    validates :nickName, presence: true, uniqueness: true
    has_many :consultas, dependent: :destroy
end