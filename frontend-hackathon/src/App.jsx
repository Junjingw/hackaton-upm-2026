import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const limpiarTextoIA = (texto) => {
  if (!texto) return "";
  // Quitamos almohadillas, asteriscos y guiones largos para que no ensucien
  return texto
    .replaceAll('###', '')
    .replaceAll('####', '')
    .replaceAll('**', '')
    .replaceAll('---', '')
    .split('\n')
    .filter(line => line.trim() !== '');
};
// ==========================================
// 1. COMPONENTE: DASHBOARD DEL CIUDADANO
// ==========================================
function Dashboard({ usuario, onLogout }) {
  const [datosEmergencia, setDatosEmergencia] = useState(null);
  const [alertaOficial, setAlertaOficial] = useState(null); // Nueva para el Admin
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // 1. Pedimos los datos de la IA (Lo que ya hacíamos)
        const resIA = await fetch(`http://localhost:3000/api/emergencias/${usuario.nickName}`);
        const dataIA = await resIA.json();
        if (resIA.ok) setDatosEmergencia(dataIA);

        // 2. Pedimos la última alerta oficial del Administrador
        const resAdmin = await fetch(`http://localhost:3000/api/alerta_oficial`);
        const dataAdmin = await resAdmin.json();
        // Cogemos solo la última alerta del array
        if (resAdmin.ok && dataAdmin.length > 0) setAlertaOficial(dataAdmin[0]);

      } catch (err) {
        console.error("Error cargando datos", err);
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [usuario.nickName]);

  // VISTA ADMIN (Se queda igual que antes)
  if (usuario.rol === 'backoffice') {
    return <AdminPanel usuario={usuario} onLogout={onLogout} />;
  }

  // VISTA CIUDADANO (Con la alerta oficial arriba)
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee' }}>
        <h2>🌤️ Panel de Ciudadano</h2>
        <button onClick={onLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
      </header>

      {/* --- CAJA DE ALERTA OFICIAL (Solo aparece si hay una) --- */}
      {alertaOficial && (
        <div style={{ background: '#ff4d4d', color: 'white', padding: '15px', borderRadius: '8px', marginTop: '20px', animation: 'pulse 2s infinite', border: '2px solid #b30000' }}>
          <h3 style={{ margin: '0' }}>⚠️ AVISO OFICIAL DE AUTORIDAD</h3>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertaOficial.mensaje}</p>
          <small>Publicado el: {new Date(alertaOficial.created_at).toLocaleString()}</small>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
  <h3 style={{ color: '#2c3e50', borderLeft: '4px solid #3498db', paddingLeft: '10px' }}>
    Hola, {usuario.nickName}
  </h3>

  {datosEmergencia && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TARJETA DE CLIMA (Diseño minimalista) */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🌡️ Datos Meteorológicos (AEMET)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
          <span><strong>Temp:</strong> {datosEmergencia.clima.tmed}°C</span>
          <span><strong>Humedad:</strong> {datosEmergencia.clima.hrMedia}%</span>
          <span><strong>Lluvia:</strong> {datosEmergencia.clima.prec} mm</span>
          <span><strong>Viento:</strong> {datosEmergencia.clima.horaracha || 'N/A'}</span>
        </div>
      </div>

      {/* TARJETA DE IA (Diseño de Alerta) */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        borderLeft: '8px solid #f1c40f', // Barra amarilla de advertencia
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
            // Detectamos si la línea es un título de sección
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
          Análisis en tiempo real generado para vivienda en <strong>{usuario.tipoVivienda}</strong>
        </div>
      </div>

    </div>
  )}
</div>
    </div>
  );
} 

// Pequeña función auxiliar para el panel de admin para no mezclar código
function AdminPanel({ usuario, onLogout }) {
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    await fetch('http://localhost:3000/api/admin/alertar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: mensaje, tipo: "CRITICA", provincia: "TODAS" })
    });
    setEnviado(true);
    setMensaje("");
    setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🛡️ Panel de Control: Backoffice</h2>
      <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ width: '100%', height: '100px' }} placeholder="Escribe la alerta oficial..." />
      <button onClick={enviar} style={{ background: '#d32f2f', color: 'white', padding: '10px', width: '100%', border: 'none', cursor: 'pointer', marginTop: '10px' }}>EMITIR ALERTA</button>
      {enviado && <p style={{ color: 'green' }}>Alerta enviada correctamente</p>}
      <button onClick={onLogout} style={{ marginTop: '20px' }}>Cerrar Sesión</button>
    </div>
  );
}


// ==========================================
// 2. COMPONENTE PRINCIPAL (LOGIN/REGISTRO)
// ==========================================
function App() {
  const [isLogin, setIsLogin] = useState(false);
  
  // NUEVO: Estado para saber si ya hemos entrado a la app
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
          // Si el login es correcto, GUARDAMOS al usuario. Esto activará el Dashboard.
          setUsuarioLogueado(datosRecibidos.usuario);
        } else {
          // Si el registro es correcto, le avisamos y le pasamos a la pantalla de login
          alert("¡Cuenta creada! Por favor, inicia sesión para entrar.");
          setIsLogin(true); // Lo cambiamos automáticamente a la vista de login
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
    setUsuarioLogueado(null); // Al ponerlo a null, React nos devuelve al formulario
    setFormData({ ...formData, password: '' }); // Borramos la contraseña por seguridad
  };

  // --- LA MAGIA DEL RENDERIZADO CONDICIONAL ---
  // Si tenemos los datos del usuario, NO mostramos el formulario, mostramos el Dashboard
  if (usuarioLogueado) {
    return <Dashboard usuario={usuarioLogueado} onLogout={handleLogout} />;
  }

  // Si no hay usuario logueado, mostramos el formulario normal:
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