import { useState, useEffect } from 'react'
function App() {
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [haBuscado, setHaBuscado] = useState(false)

  const fetchUsuarios = async (nombre = '') => {
    if (!nombre.trim()) {
      setUsuarios([])
      setHaBuscado(false)
      return
    }

    setCargando(true)
    setHaBuscado(true)
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/usuarios/?q=${nombre.trim()}`)
      const data = await response.json()
      
      const listaLimpia = (data.trabajadores || []).filter(u => 
        u && 
        u.nombre && 
        u.nombre !== "" && 
        u.nombre !== "[]" && 
        u.nombre !== "No registrado"
      )
      
      setUsuarios(listaLimpia)
    } catch (error) {
      console.error("Error al conectar con el servidor", error)
      setUsuarios([])
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-left">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Directorio Corporativo</h1>
        
        <div className="flex gap-2 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <input 
            type="text" 
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Escribe un nombre para buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsuarios(busqueda)}
          />
          <button 
            onClick={() => fetchUsuarios(busqueda)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usuarios.length > 0 ? (
            usuarios.map((u, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-all">
                <p className="font-bold text-lg text-gray-800">
                  {u.nombre === "[]" ? "" : u.nombre} {u.apellido === "[]" ? "" : u.apellido}
                </p>
                <p className="text-blue-600 text-sm font-semibold uppercase">
                  {u.cargo === "[]" ? "Colaborador" : u.cargo}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {u.email === "[]" ? "Sin correo" : u.email}
                </p>

                {/* --- SECCIÓN PARA EL CUMPLEAÑOS --- */}
                {u.cumpleanos && u.cumpleanos !== "" && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-pink-600">
                    <p className="text-sm font-medium">Cumpleaños: {u.cumpleanos}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            haBuscado && !cargando && (
              <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-lg">No se encontraron resultados para "{busqueda}"</p>
              </div>
            )
          )}
          
          {!haBuscado && (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-400 italic">Ingresa un nombre arriba para comenzar la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App