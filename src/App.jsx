import { useState, useEffect } from 'react';
import { Search, Users, Mail, Briefcase, Cake, Calendar, Building2, UserCircle, Send } from 'lucide-react';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [cargando, setCargando] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setCargando(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/usuarios/?q=${busqueda.trim()}`);
      const data = await response.json();
      
      // Procesamos la lista. Usamos 'data.trabajadores' que viene de tu vista Django
      const listaLimpia = (data.trabajadores || []).map(u => ({
          ...u,
          // Creamos un ID único seguro
          userId: u.id || `${u.nombre}_${u.apellido}_${u.email}`
      }));
      
      setUsuarios(listaLimpia);
    } catch (error) {
      console.error("Error al conectar con el servidor", error);
      setUsuarios([]);
    }
    setCargando(false);
  };

  const toggleSeleccion = (usuario) => {
    const email = usuario.email;
    if (!email || email === "[]" || email === "Sin correo") return;
    
    setSeleccionados(prev => {
      const existe = prev.find(u => u.email === email);
      if (existe) {
        return prev.filter(u => u.email !== email);
      } else {
        return [...prev, { email: email, nombre: usuario.nombre }];
      }
    });
  };

  const toggleSeleccionarTodo = () => {
    const todosVisiblesValidos = sortedUsuarios
        .filter(u => u.email && u.email !== "[]" && u.email !== "Sin correo")
        .map(u => ({ email: u.email, nombre: u.nombre }));

    const estanTodosSeleccionados = todosVisiblesValidos.length > 0 && 
      todosVisiblesValidos.every(v => seleccionados.some(s => s.email === v.email));

    if (estanTodosSeleccionados) {
      setSeleccionados([]); 
    } else {
      setSeleccionados(todosVisiblesValidos);
    }
  };

  const enviarCorreos = async () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Enviar saludo personalizado a las ${seleccionados.length} personas seleccionadas?`)) return;

    setEnviando(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/enviar-seleccionados/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: seleccionados })
      });
      const data = await response.json();
      alert(data.mensaje);
      setSeleccionados([]); 
    } catch (error) {
      alert("Error al intentar enviar los correos.");
      console.error(error);
    }
    setEnviando(false);
  };

  const getMonthFromDate = (dateString) => {
    if (!dateString || dateString === "" || dateString === "[]") return null;
    // Asume formato DD/MM (ej: 12/05)
    const parts = dateString.split('/');
    return parts.length >= 2 ? parseInt(parts[1], 10) : null;
  };

  const getDaysUntilBirthday = (dateString) => {
    if (!dateString || dateString === "" || dateString === "[]") return 999;
    const parts = dateString.split('/');
    if (parts.length < 2) return 999;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    const today = new Date();
    let birthday = new Date(today.getFullYear(), month - 1, day);
    if (birthday < today) birthday = new Date(today.getFullYear() + 1, month - 1, day);
    return Math.ceil((birthday - today) / (1000 * 60 * 60 * 24));
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    // Lógica de búsqueda flexible
    const searchLower = busqueda.toLowerCase();
    
    // Buscamos en nombre, apellido, cargo, gerencia y jefatura
    const matchesSearch = busqueda.trim() === '' ||
      (usuario.nombre && usuario.nombre.toLowerCase().includes(searchLower)) ||
      (usuario.apellido && usuario.apellido.toLowerCase().includes(searchLower)) ||
      (usuario.cargo && usuario.cargo.toLowerCase().includes(searchLower)) ||
      (usuario.gerencia_info?.nombre && usuario.gerencia_info.nombre.toLowerCase().includes(searchLower)) ||
      (usuario.jefe_directo?.nombre_completo && usuario.jefe_directo.nombre_completo.toLowerCase().includes(searchLower));
    
    const matchesMonth = !filterMonth || getMonthFromDate(usuario.cumpleanos)?.toString() === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const sortedUsuarios = [...filteredUsuarios].sort((a, b) => 
    getDaysUntilBirthday(a.cumpleanos) - getDaysUntilBirthday(b.cumpleanos)
  );

  const months = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">CMF Cumpleaños</h1>
              <p className="text-sm text-gray-600">Gestión de saludos corporativos</p>
            </div>
          </div>
          {seleccionados.length > 0 && (
            <button 
              onClick={enviarCorreos}
              disabled={enviando}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{enviando ? 'Enviando...' : `Enviar a ${seleccionados.length} seleccionados`}</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[95%] mx-auto py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo, jefatura..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsuarios()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Todos los meses</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button onClick={fetchUsuarios} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Buscar</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-center w-10">
                    <input 
                      type="checkbox" 
                      onChange={toggleSeleccionarTodo}
                      checked={seleccionados.length > 0 && seleccionados.length === sortedUsuarios.filter(u => u.email && u.email !== "Sin correo").length}
                    />
                  </th>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Cumpleaños</th>
                  <th className="px-6 py-3">Cargo</th>
                  <th className="px-6 py-3">Jefatura</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Gerencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedUsuarios.map((u, i) => {
                  const tieneCorreo = u.email && u.email !== "Sin correo";
                  const estaSeleccionado = seleccionados.some(s => s.email === u.email);

                  return (
                    <tr key={u.userId} className={estaSeleccionado ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          disabled={!tieneCorreo}
                          checked={estaSeleccionado}
                          onChange={() => toggleSeleccion(u)}
                        />
                      </td>
                      
                      {/* NOMBRE */}
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {u.nombre} {u.apellido}
                      </td>
                      
                      {/* CUMPLEAÑOS */}
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Cake className="w-4 h-4 text-blue-500" />
                            {u.cumpleanos || '-'}
                        </div>
                      </td>

                      {/* CARGO (NUEVO) */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            {u.cargo || 'Colaborador'}
                        </div>
                      </td>

                      {/* JEFATURA (NUEVO) */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-gray-400" />
                            {u.jefe_directo?.nombre_completo || '-'}
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.email}
                      </td>

                      {/* GERENCIA */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {u.gerencia_info?.nombre || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;