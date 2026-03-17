class AlertasChannel < ApplicationCable::Channel
  def subscribed
    # Los usuarios se suscriben a este "hilo" de noticias
    stream_from "emergencias_channel"
  end
end