import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// ==========================================
// 1. COMPONENTE: DASHBOARD DEL CIUDADANO
// ==========================================
function Dashboard({ usuario, onLogout }) {
  const [datosEmergencia, setDatosEmergencia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // useEffect se ejecuta automáticamente al cargar el Dashboard
  useEffect(() => {
    const obtenerAlertas = async () => {
      try {
        const respuesta = await fetch(`http://localhost:3000/api/emergencias/${usuario.nickName}`);
        const datos = await respuesta.json();

        if (respuesta.ok) {
          setDatosEmergencia(datos);
        } else {
          setError(datos.error || "Hubo un problema al obtener los datos");
        }
      } catch (err) {
        setError("Error de conexión con el servidor local.");
      } finally {
        setCargando(false);
      }
    };

    obtenerAlertas();
  }, [usuario.nickName]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Cabecera */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>🌤️ Panel de Emergencias Climáticas</h2>
        <button onClick={onLogout} style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Cerrar Sesión
        </button>
      </header>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#2c3e50' }}>Hola de nuevo, {usuario.nickName} 👋</h3>
        <p style={{ fontSize: '16px', color: '#555' }}>
          <strong>Tu perfil de riesgo:</strong> Vives en la provincia de <b>{usuario.provincia}</b> en un/a <b>{usuario.tipoVivienda.replace('_', ' ')}</b>.
        </p>

        {cargando && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            ⏳ Conectando con Inteligencia Artificial y satélites meteorológicos...
          </div>
        )}

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
            ❌ {error}
          </div>
        )}

        {datosEmergencia && !cargando && (
          <>
            {/* Tarjeta 1: El Clima */}
            <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #d9e2ec' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#334e68' }}>🌧️ Clima Actual</h4>
              {/* Aquí asumo que la UPM devuelve un campo 'weather' o similar, ajusta según su JSON */}
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#627d98' }}>
                {JSON.stringify(datosEmergencia.clima, null, 2)}
              </pre>
            </div>

            {/* Tarjeta 2: La IA y las Alertas */}
            <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #ffeeba', color: '#856404' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>🚨 Recomendación de Supervivencia (IA)</h4>
              {/* Ajusta este campo según cómo devuelva la respuesta exacta el LLM de la UPM */}
              <p style={{ fontSize: '18px', lineHeight: '1.5' }}>
                <ReactMarkdown>{datosEmergencia.recomendacion.response || datosEmergencia.recomendacion.answer || JSON.stringify(datosEmergencia.recomendacion)}</ReactMarkdown>
              </p>
            </div>
          </>
        )}
      </div>
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