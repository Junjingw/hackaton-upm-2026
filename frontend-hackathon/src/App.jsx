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

// ==========================================
// COMPONENTE DE HISTORIAL (NUEVO)
// ==========================================
function Historial({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'meteo', 'llm', 'alertas'

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        // Cargar los tres tipos de registros
        const [meteoRes, llmRes, alertasRes] = await Promise.all([
          fetch(`http://localhost:3000/api/consultas_meteo/${usuario.nickName}`),
          fetch(`http://localhost:3000/api/consultas_llm/${usuario.nickName}`),
          fetch(`http://localhost:3000/api/alertas_recibidas/${usuario.nickName}`)
        ]);

        const meteo = await meteoRes.json();
        const llm = await llmRes.json();
        const alertas = await alertasRes.json();

        // Combinar y ordenar por fecha
        const combinado = [
          ...meteo.map(m => ({ ...m, tipo: 'meteo', icono: '🌡️' })),
          ...llm.map(l => ({ ...l, tipo: 'llm', icono: '🤖' })),
          ...alertas.map(a => ({ ...a, tipo: 'alerta', icono: '⚠️' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setHistorial(combinado);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [usuario.nickName]);

  const historialFiltrado = historial.filter(item => 
    filtro === 'todos' ? true : item.tipo === filtro
  );

  if (cargando) return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando historial...</div>;

  return (
    <div style={{ marginTop: '30px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        📋 Historial de Actividad
        <span style={{ fontSize: '14px', color: '#666' }}>({historial.length} registros)</span>
      </h4>

      {/* Filtros */}
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

      {/* Listado */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                <span style={{ fontWeight: 'bold' }}>
                  {item.icono} {item.tipo === 'meteo' && 'Datos Meteorológicos'}
                  {item.tipo === 'llm' && 'Consulta a la IA'}
                  {item.tipo === 'alerta' && 'Alerta Recibida'}
                </span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(item.created_at).toLocaleString('es-ES')}
                </span>
              </div>

              {/* Contenido según tipo */}
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
                    {item.recomendacion.substring(0, 150)}...
                  </p>
                </div>
              )}

              {item.tipo === 'alerta' && (
                <div style={{ marginTop: '10px', color: '#c0392b' }}>
                  <strong>⚠️ {item.mensaje}</strong>
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
// 1. COMPONENTE: DASHBOARD DEL CIUDADANO
// ==========================================
function Dashboard({ usuario, onLogout }) {
  const [datosEmergencia, setDatosEmergencia] = useState(null);
  const [alertaOficial, setAlertaOficial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // 1. Pedimos los datos de la IA
        const resIA = await fetch(`http://localhost:3000/api/emergencias/${usuario.nickName}`);
        const dataIA = await resIA.json();
        if (resIA.ok) setDatosEmergencia(dataIA);

        // 2. Pedimos la última alerta oficial
        const resAdmin = await fetch(`http://localhost:3000/api/alerta_oficial`);
        const dataAdmin = await resAdmin.json();
        if (resAdmin.ok && dataAdmin.length > 0) setAlertaOficial(dataAdmin[0]);

        // 3. Registrar automáticamente la consulta meteorológica y de IA
        // (Esto se maneja en el backend, pero podemos confirmar)
        await fetch(`http://localhost:3000/api/registrar_consulta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickName: usuario.nickName,
            tipo: 'completa',
            data: dataIA
          })
        });

      } catch (err) {
        console.error("Error cargando datos", err);
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [usuario.nickName]);

  // VISTA ADMIN
  if (usuario.rol === 'backoffice') {
    return <AdminPanel usuario={usuario} onLogout={onLogout} />;
  }

  // VISTA CIUDADANO
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>🌤️ Panel de Ciudadano</h2>
        <div>
          <button 
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
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
            {mostrarHistorial ? '📋 Ocultar Historial' : '📋 Ver Historial'}
          </button>
          <button onClick={onLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      {/* ALERTA OFICIAL */}
      {alertaOficial && (
        <div style={{ background: '#ff4d4d', color: 'white', padding: '15px', borderRadius: '8px', marginTop: '20px', animation: 'pulse 2s infinite', border: '2px solid #b30000' }}>
          <h3 style={{ margin: '0' }}>⚠️ AVISO OFICIAL DE AUTORIDAD</h3>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertaOficial.mensaje}</p>
          <small>Publicado el: {new Date(alertaOficial.created_at).toLocaleString()}</small>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {!mostrarHistorial ? (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2c3e50', borderLeft: '4px solid #3498db', paddingLeft: '10px' }}>
            Hola, {usuario.nickName}
          </h3>

          {cargando ? (
            <p>Cargando datos meteorológicos...</p>
          ) : (
            datosEmergencia && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* TARJETA DE CLIMA */}
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🌡️ Datos Meteorológicos (AEMET)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <span><strong>Temp:</strong> {datosEmergencia.clima.tmed}°C</span>
                    <span><strong>Humedad:</strong> {datosEmergencia.clima.hrMedia}%</span>
                    <span><strong>Lluvia:</strong> {datosEmergencia.clima.prec} mm</span>
                    <span><strong>Viento:</strong> {datosEmergencia.clima.horaracha || 'N/A'}</span>
                  </div>
                </div>

                {/* TARJETA DE IA */}
                <div style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  borderLeft: '8px solid #f1c40f',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{ backgroundColor: '#fdfae3', padding: '15px', borderBottom: '1px solid #f9ebcc' }}>
                    <h4 style={{ margin: 0, color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🤖 Instrucciones de Supervivencia IA
                    </h4>
                  </div>
                  
                  <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                    {limpiarTextoIA(datosEmergencia.recomendacion.response).map((linea, index) => {
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
                    Análisis generado para vivienda en <strong>{usuario.tipoVivienda.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <Historial usuario={usuario} />
      )}
    </div>
  );
}

// Panel de Admin (sin cambios)
function AdminPanel({ usuario, onLogout }) {
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [historialAlertas, setHistorialAlertas] = useState([]);

  useEffect(() => {
    const cargarAlertas = async () => {
      const res = await fetch('http://localhost:3000/api/alertas_emitidas');
      const data = await res.json();
      setHistorialAlertas(data);
    };
    cargarAlertas();
  }, [enviado]);

  const enviar = async () => {
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
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', justifyContent: 'space-between' }}>
        🛡️ Panel de Control: Backoffice
        <button onClick={onLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>Salir</button>
      </h2>
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>Emitir Nueva Alerta</h3>
        <textarea 
          value={mensaje} 
          onChange={(e) => setMensaje(e.target.value)} 
          style={{ width: '100%', height: '100px', padding: '10px' }} 
          placeholder="Escribe la alerta oficial (ej: 'Evacuar zonas cercanas al río')" 
        />
        <button 
          onClick={enviar} 
          style={{ 
            background: '#d32f2f', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            cursor: 'pointer', 
            marginTop: '10px',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          🚨 EMITIR ALERTA A TODOS LOS CIUDADANOS
        </button>
        {enviado && <p style={{ color: 'green', marginTop: '10px' }}>✅ Alerta enviada correctamente</p>}
      </div>

      <div>
        <h3>Historial de Alertas Emitidas</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {historialAlertas.map((alerta, index) => (
            <div key={index} style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeeba', 
              padding: '15px', 
              marginBottom: '10px',
              borderRadius: '5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>⚠️ {alerta.mensaje}</strong>
                <span style={{ fontSize: '12px', color: '#856404' }}>
                  {new Date(alerta.created_at).toLocaleString()}
                </span>
              </div>
              <small>Emitida por: {alerta.admin}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (sin cambios)
// ==========================================
function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const [formData, setFormData] = useState({
    nickName: '',
    password: '',
    rol: 'ciudadano',
    provincia: '',
    tipoVivienda: '',
    necesidades: {
      sillaRuedas: false, dependiente: false, mascotas: false, ascensor: false, niños: false
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
    const datosAEnviar = isLogin ? { nickName: formData.nickName, password: formData.password } : formData;

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
          alert("¡Cuenta creada! Por favor, inicia sesión para entrar.");
          setIsLogin(true);
        }
      } else {
        alert("Error: " + datosRecibidos.detail);
      }
    } catch (error) {
      console.error("Error conectando al servidor:", error);
      alert("Error de conexión. Revisa que Rails esté encendido.");
    }
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    setFormData({ ...formData, password: '' });
  };

  if (usuarioLogueado) {
    return <Dashboard usuario={usuarioLogueado} onLogout={handleLogout} />;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>
          {isLogin ? 'Iniciar Sesión' : 'Registro de Ciudadano'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Usuario (Nickname):</label>
            <input type="text" name="nickName" value={formData.nickName} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          <div>
            <label>Contraseña:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          {!isLogin && (
            <>
              <div>
                <label>Rol:</label>
                <select name="rol" value={formData.rol} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                  <option value="ciudadano">Ciudadano</option>
                  <option value="backoffice">Backoffice (Administrador)</option>
                </select>
              </div>

              {formData.rol === 'ciudadano' && (
                <>
                  <div>
                    <label>Provincia:</label>
                    <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} placeholder="Ej: Madrid, Valencia..." />
                  </div>

                  <div>
                    <label>Tipo de Vivienda:</label>
                    <select name="tipoVivienda" value={formData.tipoVivienda} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                      <option value="">Selecciona una opción...</option>
                      <option value="sotano">Sótano</option>
                      <option value="planta_baja">Planta baja</option>
                      <option value="piso_alto">Piso alto</option>
                      <option value="casa_campo">Casa de campo</option>
                    </select>
                  </div>

                  <div>
                    <label>Información adicional:</label>
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

          <button type="submit" style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
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
  );
}

export default App;