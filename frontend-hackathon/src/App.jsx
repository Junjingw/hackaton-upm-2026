import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const limpiarTextoIA = (texto) => {
  if (!texto) return "";
  return texto
    .replaceAll('###', '')
    .replaceAll('####', '')
    .replaceAll('**', '')
    .replaceAll('---', '')
    .split('\n')
    .filter(line => line.trim() !== '');
};

// MEJORA: RenderizarRespuestaIA con limpieza manual de Markdown
const RenderizarRespuestaIA = ({ texto }) => {
  if (!texto) return null;

  const limpiarMarkdown = (t) => {
    return t.replaceAll('###', '').replaceAll('##', '').replaceAll('**', '').replaceAll('#', '');
  };

  return (
    <div style={{ marginTop: '20px', textAlign: 'left', fontFamily: 'system-ui', color: '#333' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#2980b9' }}>
        <span style={{ fontSize: '24px' }}>💬</span>
        <strong style={{ fontSize: '1.2rem' }}>Respuesta a tu consulta personalizada</strong>
      </div>

      <div style={{ 
        backgroundColor: '#fdfae3', 
        padding: '20px', 
        borderRadius: '12px', 
        borderLeft: '8px solid #3498db',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        lineHeight: '1.6'
      }}>
        <div style={{ whiteSpace: 'pre-line' }}>
          {limpiarMarkdown(texto)}
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', color: '#c62828' }}>🚨 ¿Peligro inminente?</p>
          <a href="tel:112" style={{ 
            display: 'inline-block', padding: '10px 20px', backgroundColor: '#e74c3c', 
            color: 'white', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold' 
          }}> Llamar al 112 </a>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// NUEVO: COMPONENTE HISTORIAL DE ACTIVIDAD COMPLETO (CON FILTROS)
// ==========================================
const HistorialActividad = ({ usuario }) => {
  const [actividades, setActividades] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [cargando, setCargando] = useState(true);

  const cargarActividad = async () => {
    try {
      setCargando(true);
      // Obtener datos del endpoint de historial completo
      const res = await fetch(`http://localhost:3000/api/historial_completo/${usuario.nickName}`);
      const data = await res.json();
      setActividades(data);
    } catch (error) {
      console.error("Error cargando historial completo:", error);
      setActividades([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { 
    cargarActividad(); 
  }, [usuario.nickName]);

  // Lógica de filtrado (adaptada para cubrir todos los tipos)
  const actividadesFiltradas = actividades.filter(item => {
    if (filtro === 'Todos') return true;
    if (filtro === 'Meteorología') return item.tipo === 'meteorologia' || item.tipo === 'meteo';
    if (filtro === 'Consultas IA') return item.tipo === 'consulta' || item.tipo === 'llm';
    if (filtro === 'Alertas') return item.tipo === 'alerta' || item.tipo === 'alertas';
    return true;
  });

  // Formatear el detalle según el tipo de actividad
  const formatearDetalle = (item) => {
    if (item.tipo === 'meteorologia' || item.tipo === 'meteo') {
      return `🌡️ Temp: ${item.temperatura || 'N/A'}°C | 💧 Humedad: ${item.humedad || 'N/A'}% | ☔ Lluvia: ${item.precipitacion || 'N/A'} mm | 💨 Viento: ${item.viento || 'N/A'} km/h`;
    }
    if (item.tipo === 'consulta' || item.tipo === 'llm') {
      return item.detalle || (item.recomendacion ? item.recomendacion.substring(0, 150) + '...' : 'Sin detalle');
    }
    if (item.tipo === 'alerta' || item.tipo === 'alertas') {
      return item.detalle || item.mensaje || 'Alerta sin contenido';
    }
    return item.detalle || 'Sin información disponible';
  };

  // Obtener título formateado
  const formatearTitulo = (item) => {
    if (item.tipo === 'meteorologia' || item.tipo === 'meteo') return 'Datos Meteorológicos';
    if (item.tipo === 'consulta' || item.tipo === 'llm') return 'Consulta a IA';
    if (item.tipo === 'alerta' || item.tipo === 'alertas') return 'Alerta Recibida';
    return item.titulo || 'Actividad';
  };

  // Obtener color/icono según tipo
  const obtenerEstiloTipo = (item) => {
    if (item.tipo === 'meteorologia' || item.tipo === 'meteo') return { color: '#3498db', icono: '🌡️' };
    if (item.tipo === 'consulta' || item.tipo === 'llm') return { color: '#f1c40f', icono: '🤖' };
    if (item.tipo === 'alerta' || item.tipo === 'alertas') return { color: '#e74c3c', icono: '⚠️' };
    return { color: '#2c3e50', icono: '📋' };
  };

  if (cargando) return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando historial...</div>;

  return (
    <div style={{ 
      background: 'white', 
      padding: '20px', 
      borderRadius: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>📋 Historial de Actividad ({actividadesFiltradas.length} registros)</h3>
      
      {/* BOTONES DE FILTRO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Todos', 'Meteorología', 'Consultas IA', 'Alertas'].map(f => (
          <button 
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '8px 15px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: filtro === f ? '#3498db' : '#ecf0f1',
              color: filtro === f ? 'white' : '#7f8c8d',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* LISTA DE REGISTROS */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {actividadesFiltradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bdc3c7', padding: '20px' }}>
            No hay registros de {filtro.toLowerCase()}
          </p>
        ) : (
          actividadesFiltradas.map((item, index) => {
            const estilo = obtenerEstiloTipo(item);
            return (
              <div 
                key={`${item.tipo}-${item.id || index}`} 
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #eee', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '5px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: estilo.color
                  }}>
                    {estilo.icono} {formatearTitulo(item)}
                  </span>
                  <small style={{ color: '#95a5a6', fontSize: '12px' }}>
                    {new Date(item.fecha || item.created_at).toLocaleString('es-ES')}
                  </small>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#34495e', lineHeight: '1.5' }}>
                  {formatearDetalle(item)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE DE HISTORIAL ADMIN (MANTENIDO PERO ACTUALIZADO)
// ==========================================
function HistorialAdmin({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const [meteoRes, llmRes, alertasRes] = await Promise.all([
          fetch(`http://localhost:3000/api/admin/consultas_meteo`),
          fetch(`http://localhost:3000/api/admin/consultas_llm`),
          fetch(`http://localhost:3000/api/admin/alertas_emitidas`)
        ]);

        const meteo = await meteoRes.json();
        const llm = await llmRes.json();
        const alertas = await alertasRes.json();

        const combinado = [
          ...meteo.map(m => ({ ...m, tipo: 'meteo', icono: '🌡️', fecha: m.created_at })),
          ...llm.map(l => ({ ...l, tipo: 'llm', icono: '🤖', fecha: l.created_at })),
          ...alertas.map(a => ({ ...a, tipo: 'alerta', icono: '⚠️', fecha: a.created_at }))
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        setHistorial(combinado);
      } catch (error) {
        console.error("Error cargando historial admin:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, []);

  const historialFiltrado = historial.filter(item => 
    filtro === 'todos' ? true : item.tipo === filtro
  );

  if (cargando) return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando historial global...</div>;

  return (
    <div style={{ marginTop: '30px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        📊 Historial Global del Sistema
        <span style={{ fontSize: '14px', color: '#666' }}>({historial.length} registros totales)</span>
      </h4>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['todos', 'meteo', 'llm', 'alertas'].map(tipo => (
          <button
            key={tipo}
            onClick={() => setFiltro(tipo)}
            style={{
              padding: '5px 15px',
              borderRadius: '20px',
              border: 'none',
              background: filtro === tipo ? '#3498db' : '#e0e0e0',
              color: filtro === tipo ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tipo === 'todos' && '📊 Todos'}
            {tipo === 'meteo' && '🌡️ Meteorología'}
            {tipo === 'llm' && '🤖 Consultas IA'}
            {tipo === 'alertas' && '⚠️ Alertas'}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {historialFiltrado.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No hay registros de {filtro}
          </p>
        ) : (
          historialFiltrado.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                borderLeft: `4px solid ${
                  item.tipo === 'meteo' ? '#3498db' : 
                  item.tipo === 'llm' ? '#f1c40f' : '#e74c3c'
                }`,
                background: '#f8f9fa',
                marginBottom: '10px',
                borderRadius: '0 8px 8px 0',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>
                    {item.icono} {item.tipo === 'meteo' && 'Datos Meteorológicos'}
                    {item.tipo === 'llm' && 'Consulta a la IA'}
                    {item.tipo === 'alerta' && 'Alerta Emitida'}
                  </span>
                  {item.nickName && (
                    <span style={{ marginLeft: '10px', background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      👤 {item.nickName}
                    </span>
                  )}
                </div>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(item.fecha).toLocaleString('es-ES')}
                </span>
              </div>

              {item.tipo === 'meteo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <span>🌡️ Temp: {item.temperatura}°C</span>
                  <span>💧 Humedad: {item.humedad}%</span>
                  <span>☔ Lluvia: {item.precipitacion} mm</span>
                  <span>💨 Viento: {item.viento} km/h</span>
                </div>
              )}

              {item.tipo === 'llm' && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ background: 'white', padding: '10px', borderRadius: '5px', margin: 0 }}>
                    {item.recomendacion.substring(0, 200)}...
                  </p>
                </div>
              )}

              {item.tipo === 'alerta' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ color: '#c0392b' }}>
                    <strong>⚠️ {item.mensaje}</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                    Provincia: {item.provincia || 'TODAS'} | Tipo: {item.tipo_alerta || 'CRITICA'}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 1. DASHBOARD CIUDADANO (CON NUEVO HISTORIAL DE ACTIVIDAD)
// ==========================================
function Dashboard({ usuario, onLogout }) {
  const [datosEmergencia, setDatosEmergencia] = useState(null);
  const [alertaOficial, setAlertaOficial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarHistorialGeneral, setMostrarHistorialGeneral] = useState(false); // Historial de Actividad completo
  
  // Historial de consultas individual
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [mostrarHistorialConsultas, setMostrarHistorialConsultas] = useState(false);
  
  const [preguntaUsuario, setPreguntaUsuario] = useState("");
  const [respuestaIA, setRespuestaIA] = useState(null);
  const [cargandoChat, setCargandoChat] = useState(false);

  // Función para obtener historial de consultas individual
  const obtenerHistorialConsultas = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/historial/${usuario.nickName}`);
      const data = await response.json();
      setHistorialConsultas(data);
      setMostrarHistorialConsultas(!mostrarHistorialConsultas);
    } catch (error) {
      console.error("Error al cargar historial de consultas:", error);
    }
  };

  const enviarPregunta = async () => {
    if (!preguntaUsuario) return;
    setRespuestaIA("Pensando...");
    setCargandoChat(true);

    try {
      const res = await fetch(`http://localhost:3000/api/preguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickName: usuario.nickName,
          pregunta: preguntaUsuario 
        })
      });
      
      const data = await res.json();
      
      if (data.recomendacion && data.recomendacion.response) {
        setRespuestaIA(data.recomendacion.response);
        obtenerHistorialConsultas(); // Actualizar historial de consultas
      } else {
        setRespuestaIA("No recibí una respuesta clara. Intenta de nuevo.");
      }
    } catch (err) {
      setRespuestaIA("Error de conexión con el servidor.");
    } finally {
      setCargandoChat(false);
    }
  };

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const resIA = await fetch(`http://localhost:3000/api/emergencias/${usuario.nickName}`);
        const dataIA = await resIA.json();
        if (resIA.ok) setDatosEmergencia(dataIA);

        const resAdmin = await fetch(`http://localhost:3000/api/alerta_oficial`);
        const dataAdmin = await resAdmin.json();
        if (resAdmin.ok && dataAdmin.length > 0) setAlertaOficial(dataAdmin[0]);

        if (resIA.ok) {
          await fetch(`http://localhost:3000/api/registrar_consulta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nickName: usuario.nickName,
              tipo: 'completa',
              clima: dataIA.clima,
              recomendacion: dataIA.recomendacion
            })
          });
        }

      } catch (err) {
        console.error("Error cargando datos", err);
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [usuario.nickName]);

  if (usuario.rol === 'backoffice') {
    return <AdminPanel usuario={usuario} onLogout={onLogout} />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>🌤️ Panel de Ciudadano</h2>
        <div>
          <button 
            onClick={() => setMostrarHistorialGeneral(!mostrarHistorialGeneral)}
            style={{ 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              padding: '5px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {mostrarHistorialGeneral ? '📋 Ocultar Historial de Actividad' : '📋 Ver Historial de Actividad'}
          </button>
          <button onClick={onLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      {!mostrarHistorialGeneral ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {alertaOficial && (
            <div style={{ 
              background: '#ff4d4d', 
              color: 'white', 
              padding: '15px', 
              borderRadius: '8px', 
              marginTop: '20px', 
              animation: 'pulse 2s infinite', 
              border: '2px solid #b30000' 
            }}>
              <h3 style={{ margin: '0' }}>⚠️ AVISO OFICIAL DE AUTORIDAD</h3>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertaOficial.mensaje}</p>
              <small>Publicado el: {new Date(alertaOficial.created_at).toLocaleString()}</small>
            </div>
          )}

          {cargando ? (
            <p style={{ marginTop: '20px' }}>Cargando datos meteorológicos...</p>
          ) : (
            <>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '10px', 
                border: '1px solid #dee2e6',
                marginTop: '20px' 
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🌡️ Datos Meteorológicos (AEMET)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <span><strong>Temp:</strong> {datosEmergencia?.clima?.tmed || 'N/A'}°C</span>
                  <span><strong>Humedad:</strong> {datosEmergencia?.clima?.hrMedia || 'N/A'}%</span>
                  <span><strong>Lluvia:</strong> {datosEmergencia?.clima?.prec || 'N/A'} mm</span>
                  <span><strong>Viento:</strong> {datosEmergencia?.clima?.horaracha || 'N/A'}</span>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                borderLeft: '8px solid #f1c40f',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                marginTop: '20px'
              }}>
                <div style={{ backgroundColor: '#fdfae3', padding: '15px', borderBottom: '1px solid #f9ebcc' }}>
                  <h4 style={{ margin: 0, color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🤖 Instrucciones de Supervivencia IA (Automáticas)
                  </h4>
                </div>
                
                <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                  {limpiarTextoIA(datosEmergencia?.recomendacion?.response || 'No hay recomendaciones disponibles').map((linea, index) => {
                    const esTitulo = linea.includes(':') && linea.length < 50;
                    return (
                      <p key={index} style={{ 
                        marginBottom: '12px',
                        lineHeight: '1.5',
                        fontSize: esTitulo ? '1.1rem' : '0.95rem',
                        fontWeight: esTitulo ? '700' : '400',
                        color: esTitulo ? '#2c3e50' : '#444',
                        paddingLeft: linea.startsWith('-') ? '15px' : '0'
                      }}>
                        {linea}
                      </p>
                    );
                  })}
                </div>
                
                <div style={{ backgroundColor: '#f8f9fa', padding: '10px', fontSize: '12px', textAlign: 'center', color: '#95a5a6' }}>
                  Análisis generado para vivienda en <strong>{usuario.tipoVivienda?.replace('_', ' ') || 'desconocida'}</strong>
                </div>
              </div>

              <div style={{ 
                marginTop: '30px', 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                padding: '20px', 
                borderRadius: '15px', 
                border: '1px solid #3498db',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2980b9' }}>❓ ¿Tienes alguna duda específica?</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    value={preguntaUsuario}
                    onChange={(e) => setPreguntaUsuario(e.target.value)}
                    placeholder="Ej: ¿Qué hago con los electrodomésticos?"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '250px' }}
                    disabled={cargandoChat}
                  />
                  <button 
                    onClick={enviarPregunta}
                    disabled={cargandoChat || !preguntaUsuario.trim()}
                    style={{ 
                      background: cargandoChat ? '#95a5a6' : '#3498db', 
                      color: 'white', 
                      border: 'none', 
                      padding: '0 20px', 
                      borderRadius: '8px', 
                      cursor: cargandoChat ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cargandoChat ? "..." : "Preguntar"}
                  </button>
                </div>
                {respuestaIA && <RenderizarRespuestaIA texto={respuestaIA} />}
              </div>

              {/* Historial de Consultas Individual */}
              <div style={{ marginTop: '30px' }}>
                <button 
                  onClick={obtenerHistorialConsultas}
                  style={{
                    backgroundColor: '#34495e',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {mostrarHistorialConsultas ? 'Hide History' : '📜 Ver mi Historial de Consultas'}
                </button>

                {mostrarHistorialConsultas && (
                  <div style={{ 
                    marginTop: '15px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid #ddd'
                  }}>
                    {historialConsultas.length === 0 ? (
                      <p>No tienes consultas guardadas todavía.</p>
                    ) : (
                      historialConsultas.map((item) => (
                        <div key={item.id} style={{ 
                          marginBottom: '15px', 
                          paddingBottom: '10px', 
                          borderBottom: '1px solid #eee' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#7f8c8d' }}>
                            <span>📅 {new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#2c3e50' }}>
                            ❓ {item.pregunta}
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#34495e', fontStyle: 'italic' }}>
                            🤖 {item.respuesta.length > 200 ? item.respuesta.substring(0, 200) + '...' : item.respuesta}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        // REEMPLAZAMOS EL HISTORIAL ANTIGUO POR EL NUEVO COMPONENTE HistorialActividad
        <HistorialActividad usuario={usuario} />
      )}
    </div>
  );
}

// ==========================================
// 2. PANEL DE ADMIN ACTUALIZADO
// ==========================================
function AdminPanel({ usuario, onLogout }) {
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [mostrarHistorialGeneral, setMostrarHistorialGeneral] = useState(false);

  // Historial de consultas admin
  const [historialConsultasAdmin, setHistorialConsultasAdmin] = useState([]);
  const [mostrarHistorialConsultasAdmin, setMostrarHistorialConsultasAdmin] = useState(false);

  const [datosEmergenciaAdmin, setDatosEmergenciaAdmin] = useState(null);
  const [cargandoAdmin, setCargandoAdmin] = useState(true);
  const [preguntaAdmin, setPreguntaAdmin] = useState("");
  const [respuestaAdminIA, setRespuestaAdminIA] = useState(null);
  const [cargandoChatAdmin, setCargandoChatAdmin] = useState(false);

  const obtenerHistorialConsultasAdmin = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/historial/${usuario.nickName}`);
      const data = await response.json();
      setHistorialConsultasAdmin(data);
      setMostrarHistorialConsultasAdmin(!mostrarHistorialConsultasAdmin);
    } catch (error) {
      console.error("Error al cargar historial de consultas admin:", error);
    }
  };

  const enviarAlerta = async () => {
    if (!mensaje.trim()) return;
    try {
      await fetch('http://localhost:3000/api/admin/alertar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: mensaje, 
          tipo: "CRITICA", 
          provincia: "TODAS",
          admin: usuario.nickName
        })
      });
      setEnviado(true);
      setMensaje("");
      setTimeout(() => setEnviado(false), 3000);
    } catch (err) {
      console.error("Error enviando alerta:", err);
      alert("Error al enviar la alerta. Revisa el servidor.");
    }
  };

  const enviarPreguntaAdmin = async () => {
    if (!preguntaAdmin) return;
    setRespuestaAdminIA("Pensando...");
    setCargandoChatAdmin(true);

    try {
      const res = await fetch(`http://localhost:3000/api/preguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickName: usuario.nickName,
          pregunta: preguntaAdmin 
        })
      });
      
      const data = await res.json();
      
      if (data.recomendacion && data.recomendacion.response) {
        setRespuestaAdminIA(data.recomendacion.response);
        obtenerHistorialConsultasAdmin();
      } else {
        setRespuestaAdminIA("No recibí una respuesta clara. Intenta de nuevo.");
      }
    } catch (err) {
      setRespuestaAdminIA("Error de conexión con el servidor.");
    } finally {
      setCargandoChatAdmin(false);
    }
  };

  useEffect(() => {
    const cargarDatosAdmin = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/emergencias/${usuario.nickName}`);
        const data = await res.json();
        if (res.ok) setDatosEmergenciaAdmin(data);
      } catch (err) {
        console.error("Error cargando datos admin", err);
      } finally {
        setCargandoAdmin(false);
      }
    };
    cargarDatosAdmin();
  }, [usuario.nickName]);

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>🛡️ Panel de Control: Backoffice</h2>
        <div>
          <button 
            onClick={() => setMostrarHistorialGeneral(!mostrarHistorialGeneral)}
            style={{ 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              padding: '5px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {mostrarHistorialGeneral ? '📊 Ocultar Historial Global' : '📊 Ver Historial Global'}
          </button>
          <button onClick={onLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      {!mostrarHistorialGeneral ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* PANEL PARA ENVIAR ALERTAS */}
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px', marginTop: '20px' }}>
            <h3>Emitir Nueva Alerta Oficial</h3>
            <textarea 
              value={mensaje} 
              onChange={(e) => setMensaje(e.target.value)} 
              style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} 
              placeholder="Escribe la alerta para todos los ciudadanos" 
            />
            <button 
              onClick={enviarAlerta} 
              style={{ 
                background: '#d32f2f', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                cursor: 'pointer', 
                marginTop: '10px',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              🚨 EMITIR ALERTA
            </button>
            {enviado && <p style={{ color: '#27ae60', marginTop: '10px', fontWeight: '500' }}>✅ Alerta enviada correctamente</p>}
          </div>

          {/* DATOS METEOROLÓGICOS ADMIN */}
          {cargandoAdmin ? (
            <p>⏳ Cargando datos meteorológicos...</p>
          ) : (
            <>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '10px', 
                border: '1px solid #dee2e6',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🌡️ Datos Meteorológicos en Tiempo Real (AEMET)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <span><strong>Temperatura:</strong> {datosEmergenciaAdmin?.clima?.tmed || 'N/A'}°C</span>
                  <span><strong>Humedad:</strong> {datosEmergenciaAdmin?.clima?.hrMedia || 'N/A'}%</span>
                  <span><strong>Precipitación:</strong> {datosEmergenciaAdmin?.clima?.prec || 'N/A'} mm</span>
                  <span><strong>Viento:</strong> {datosEmergenciaAdmin?.clima?.horaracha || 'N/A'}</span>
                </div>
              </div>

              {/* CHAT IA ADMIN */}
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                padding: '20px', 
                borderRadius: '15px', 
                border: '1px solid #3498db',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2980b9' }}>🤖 Consulta Manual a la IA (Administrador)</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    value={preguntaAdmin}
                    onChange={(e) => setPreguntaAdmin(e.target.value)}
                    placeholder="Escribe tu consulta..."
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '250px' }}
                    disabled={cargandoChatAdmin}
                  />
                  <button 
                    onClick={enviarPreguntaAdmin}
                    disabled={cargandoChatAdmin || !preguntaAdmin.trim()}
                    style={{ 
                      background: cargandoChatAdmin ? '#95a5a6' : '#3498db', 
                      color: 'white', 
                      border: 'none', 
                      padding: '0 20px', 
                      borderRadius: '8px', 
                      cursor: cargandoChatAdmin ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cargandoChatAdmin ? "..." : "Preguntar"}
                  </button>
                </div>
                {respuestaAdminIA && <RenderizarRespuestaIA texto={respuestaAdminIA} />}
              </div>

              {/* HISTORIAL DE CONSULTAS ADMIN */}
              <div style={{ marginTop: '30px' }}>
                <button 
                  onClick={obtenerHistorialConsultasAdmin}
                  style={{
                    backgroundColor: '#34495e',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {mostrarHistorialConsultasAdmin ? 'Hide History' : '📜 Ver mi Historial de Consultas'}
                </button>

                {mostrarHistorialConsultasAdmin && (
                  <div style={{ 
                    marginTop: '15px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid #ddd'
                  }}>
                    {historialConsultasAdmin.length === 0 ? (
                      <p>No tienes consultas guardadas todavía.</p>
                    ) : (
                      historialConsultasAdmin.map((item) => (
                        <div key={item.id} style={{ 
                          marginBottom: '15px', 
                          paddingBottom: '10px', 
                          borderBottom: '1px solid #eee' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#7f8c8d' }}>
                            <span>📅 {new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#2c3e50' }}>
                            ❓ {item.pregunta}
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#34495e', fontStyle: 'italic' }}>
                            🤖 {item.respuesta.length > 200 ? item.respuesta.substring(0, 200) + '...' : item.respuesta}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      ) : (
        <HistorialAdmin usuario={usuario} />
      )}
    </div>
  );
}

// ==========================================
// 3. COMPONENTE PRINCIPAL APP
// ==========================================
function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const [formData, setFormData] = useState({
    nickName: '',
    password: '',
    rol: 'ciudadano',
    adminToken: '',
    provincia: '',
    tipoVivienda: '',
    necesidades: {
      sillaRuedas: false,
      dependiente: false,
      mascotas: false,
      ascensor: false,
      niños: false
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, necesidades: { ...formData.necesidades, [name]: checked } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? 'http://localhost:3000/api/login' : 'http://localhost:3000/api/registro';
    const datosAEnviar = isLogin 
      ? { nickName: formData.nickName, password: formData.password } 
      : { ...formData };

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosAEnviar)
      });

      const datosRecibidos = await respuesta.json();

      if (respuesta.ok) {
        if (isLogin) {
          setUsuarioLogueado(datosRecibidos.usuario);
        } else {
          alert("¡Cuenta creada! Inicia sesión");
          setIsLogin(true);
          setFormData({
            nickName: '',
            password: '',
            rol: 'ciudadano',
            adminToken: '',
            provincia: '',
            tipoVivienda: '',
            necesidades: {
              sillaRuedas: false,
              dependiente: false,
              mascotas: false,
              ascensor: false,
              niños: false
            }
          });
        }
      } else {
        alert("Error: " + (datosRecibidos.detail || 'No se pudo completar'));
      }
    } catch (error) {
      console.error("Error conectando al servidor:", error);
      alert("Error de conexión. Revisa el servidor Rails.");
    }
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    setFormData({ ...formData, password: '', adminToken: '' });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        minHeight: '100vh', 
        padding: '20px' 
      }}>
        {usuarioLogueado ? (
          <Dashboard usuario={usuarioLogueado} onLogout={handleLogout} />
        ) : (
          <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
              <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>
                {isLogin ? 'Iniciar Sesión' : 'Registro de Ciudadano'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: '500' }}>Usuario (Nickname):</label>
                  <input type="text" name="nickName" value={formData.nickName} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>

                <div>
                  <label style={{ fontWeight: '500' }}>Contraseña:</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label style={{ fontWeight: '500' }}>Rol:</label>
                      <select name="rol" value={formData.rol} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}>
                        <option value="ciudadano">Ciudadano</option>
                        <option value="backoffice">Backoffice (Administrador)</option>
                      </select>
                    </div>

                    {formData.rol === 'backoffice' && (
                      <div style={{ marginTop: '10px', padding: '10px', background: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeeba' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#856404' }}>CÓDIGO SECRETO DE ADMINISTRADOR</label>
                        <input 
                          type="password" 
                          placeholder="Introduce el código de la UPM"
                          value={formData.adminToken}
                          onChange={e => setFormData({...formData, adminToken: e.target.value})}
                          style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #856404', borderRadius: '6px' }}
                          required
                        />
                      </div>
                    )}

                    {formData.rol === 'ciudadano' && (
                      <>
                        <div>
                          <label style={{ fontWeight: '500' }}>Provincia:</label>
                          <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }} placeholder="Ej: Madrid, Valencia..." />
                        </div>

                        <div>
                          <label style={{ fontWeight: '500' }}>Tipo de Vivienda:</label>
                          <select name="tipoVivienda" value={formData.tipoVivienda} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' }}>
                            <option value="">Selecciona una opción...</option>
                            <option value="sotano">Sótano</option>
                            <option value="planta_baja">Planta baja</option>
                            <option value="piso_alto">Piso alto</option>
                            <option value="casa_campo">Casa de campo</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontWeight: '500' }}>Información adicional:</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                            <label><input type="checkbox" name="sillaRuedas" checked={formData.necesidades.sillaRuedas} onChange={handleCheckboxChange} /> Silla de ruedas</label>
                            <label><input type="checkbox" name="dependiente" checked={formData.necesidades.dependiente} onChange={handleCheckboxChange} /> Persona dependiente</label>
                            <label><input type="checkbox" name="mascotas" checked={formData.necesidades.mascotas} onChange={handleCheckboxChange} /> Mascotas</label>
                            <label><input type="checkbox" name="ascensor" checked={formData.necesidades.ascensor} onChange={handleCheckboxChange} /> Ascensor</label>
                            <label><input type="checkbox" name="niños" checked={formData.necesidades.niños} onChange={handleCheckboxChange} /> Niños</label>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <button type="submit" style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                  {isLogin ? 'Entrar' : 'Registrarme'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#3498db', textDecoration: 'underline', cursor: 'pointer' }}>
                  {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;