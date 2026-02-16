import { useState, useEffect } from 'react';
import { Search, Users, Mail, Briefcase, Cake, Calendar, Building2, UserCircle } from 'lucide-react';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [cargando, setCargando] = useState(false);

  // Cargar todos los usuarios al iniciar
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setCargando(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/usuarios/?q=${busqueda.trim()}`);
      const data = await response.json();
      
      // Cargar estados guardados del localStorage
      const savedStates = JSON.parse(localStorage.getItem('usuariosEstados') || '{}');
      
      const listaLimpia = (data.trabajadores || []).filter(
        u => u && u.nombre && u.nombre !== "" && u.nombre !== "[]" && u.nombre !== "No registrado"
      ).map(u => {
        // Crear un identificador único para cada usuario
        const userId = `${u.nombre}_${u.apellido}_${u.email}`;
        
        // Si existe un estado guardado, usarlo; si no, activo por defecto
        const is_active = savedStates[userId] !== undefined ? savedStates[userId] : true;
        
        return {
          ...u,
          userId, // Guardar el ID único
          is_active
        };
      });
      
      setUsuarios(listaLimpia);
    } catch (error) {
      console.error("Error al conectar con el servidor", error);
      setUsuarios([]);
    }
    setCargando(false);
  };

  const toggleUserStatus = (index) => {
    const updatedUsuarios = [...usuarios];
    updatedUsuarios[index].is_active = !updatedUsuarios[index].is_active;
    
    // Guardar el estado en localStorage
    const savedStates = JSON.parse(localStorage.getItem('usuariosEstados') || '{}');
    const userId = updatedUsuarios[index].userId;
    savedStates[userId] = updatedUsuarios[index].is_active;
    localStorage.setItem('usuariosEstados', JSON.stringify(savedStates));
    
    setUsuarios(updatedUsuarios);
  };

  const getMonthFromDate = (dateString) => {
    if (!dateString || dateString === "" || dateString === "[]") return null;
    try {
      // Asume formato DD/MM o similar
      const parts = dateString.split('/');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10); // Retorna el mes
      }
    } catch (error) {
      return null;
    }
    return null;
  };

  const getDayFromDate = (dateString) => {
    if (!dateString || dateString === "" || dateString === "[]") return null;
    try {
      const parts = dateString.split('/');
      if (parts.length >= 1) {
        return parseInt(parts[0], 10); // Retorna el día
      }
    } catch (error) {
      return null;
    }
    return null;
  };

  // Función para calcular días hasta el próximo cumpleaños
  const getDaysUntilBirthday = (dateString) => {
    if (!dateString || dateString === "" || dateString === "[]") return 999; // Los sin cumpleaños van al final

    const day = getDayFromDate(dateString);
    const month = getMonthFromDate(dateString);
    
    if (!day || !month) return 999;

    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Crear fecha del cumpleaños de este año
    let birthday = new Date(currentYear, month - 1, day);
    
    // Si el cumpleaños ya pasó este año, usar el del próximo año
    if (birthday < today) {
      birthday = new Date(currentYear + 1, month - 1, day);
    }
    
    // Calcular diferencia en días
    const diffTime = birthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    // Filtro por búsqueda (nombre, jefatura, gerencia)
    const matchesSearch = 
      busqueda.trim() === '' ||
      (usuario.nombre && usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.apellido && usuario.apellido.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.jefe_directo?.nombre_completo && usuario.jefe_directo.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.gerencia_info?.nombre && usuario.gerencia_info.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    // Filtro por mes
    const matchesMonth = !filterMonth || getMonthFromDate(usuario.cumpleanos)?.toString() === filterMonth;
    // Filtro por estado activo/inactivo
    const matchesStatus = 
      filterStatus === 'todos' || 
      (filterStatus === 'activo' && usuario.is_active === true) ||
      (filterStatus === 'inactivo' && usuario.is_active === false);

    return matchesSearch && matchesMonth && matchesStatus;
  });

  // Ordenar por cumpleaños más cercano
  const sortedUsuarios = [...filteredUsuarios].sort((a, b) => {
    return getDaysUntilBirthday(a.cumpleanos) - getDaysUntilBirthday(b.cumpleanos);
  });

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CMF Cumpleaños</h1>
                <p className="text-sm text-gray-600">Busca y encuentra información de empleados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Search and Filters Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              {/* Search and Button Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, jefatura o gerencia."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsuarios()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={fetchUsuarios}
                  disabled={cargando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {cargando ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Month Filter */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Todos los meses</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-6 px-4 py-2 border border-gray-300 rounded-lg bg-white">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="todos"
                        checked={filterStatus === 'todos'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Todos</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="activo"
                        checked={filterStatus === 'activo'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Activo</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactivo"
                        checked={filterStatus === 'inactivo'}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {cargando ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Cargando empleados...</p>
            </div>
          ) : sortedUsuarios.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No se encontraron resultados</p>
              <p className="text-gray-500 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-[6%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumpleaños
                    </th>
                    <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="w-[16%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jefatura
                    </th>
                    <th className="w-[16%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gerencia
                    </th>
                    <th className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsuarios.map((u, i) => {
                    // Encontrar el índice original en el array de usuarios
                    const originalIndex = usuarios.findIndex(user => user.userId === u.userId);
                    
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-4">
                          <button
                            onClick={() => toggleUserStatus(originalIndex)}
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer hover:opacity-80 ${
                              u.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {u.nombre === "[]" ? "" : u.nombre} {u.apellido === "[]" ? "" : u.apellido}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {u.cumpleanos && u.cumpleanos !== "" && u.cumpleanos !== "[]" ? (
                            <div className="flex items-center space-x-1">
                              <Cake className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm text-gray-900 whitespace-nowrap">{u.cumpleanos}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {u.email === "[]" ? "Sin correo" : u.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center space-x-1">
                            <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {u.jefatura && u.jefatura !== "[]" ? u.jefatura : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {u.gerencia && u.gerencia !== "[]" ? u.gerencia : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {u.cargo === "[]" ? "Colaborador" : u.cargo}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium">{sortedUsuarios.length}</span> empleado(s)
              {(busqueda || filterMonth || filterStatus !== 'todos') ? ' (filtrado)' : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;