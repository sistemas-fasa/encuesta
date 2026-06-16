import fs from 'fs';

const path = 'C:\\Users\\Pc\\Documents\\Encuestas\\src\\pages\\Admin.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Users to lucide-react imports if not present
if (!content.includes('Users,')) {
    content = content.replace("from 'lucide-react';", "Users, UserPlus } from 'lucide-react';");
}

const lines = content.split('\n');

function insertAfter(targetStr, insertLines) {
    const idx = lines.findIndex(l => l.includes(targetStr));
    if (idx !== -1) {
        lines.splice(idx + 1, 0, ...insertLines);
    } else {
        console.error("Target not found: " + targetStr);
    }
}

function insertBefore(targetStr, insertLines) {
    const idx = lines.findIndex(l => l.includes(targetStr));
    if (idx !== -1) {
        lines.splice(idx, 0, ...insertLines);
    } else {
        console.error("Target not found: " + targetStr);
    }
}

// 2. Add State
if (!content.includes('const [usuarios, setUsuarios]')) {
    insertAfter('const [highlightedBancoId', [
        '  const [usuarios, setUsuarios] = useState([]);',
        '  const [isEditingUser, setIsEditingUser] = useState(false);',
        '  const [editingUser, setEditingUser] = useState({ usuario: "", password: "", nombre: "", rol: "admin", estado: 1 });'
    ]);
}

// 3. Add loadUsuarios function
if (!content.includes('const loadUsuarios = async')) {
    insertAfter('const loadBancoPreguntas = async () => {', [
        '  const loadUsuarios = async () => {',
        '    try {',
        '      const data = await api.getUsuarios();',
        '      setUsuarios(data);',
        '    } catch (err) { console.error("Error loading users:", err); }',
        '  };'
    ]);
}

// 4. Add handlers for users
if (!content.includes('const handleSaveUser = async')) {
    insertAfter('const handleSaveBanco = async () => {', [
        '  const handleSaveUser = async () => {',
        '    try {',
        '      if (!editingUser.id) {',
        '        await api.createUsuario(editingUser);',
        '      } else {',
        '        await api.updateUsuario(editingUser.id, editingUser);',
        '      }',
        '      setIsEditingUser(false);',
        '      loadUsuarios();',
        '      Swal.fire({ icon: "success", title: "Guardado", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });',
        '    } catch (err) {',
        '      Swal.fire({ icon: "error", title: "Error", text: err.message });',
        '    }',
        '  };',
        '',
        '  const handleDeleteUser = async (id) => {',
        '    const result = await Swal.fire({ title: "¿Eliminar usuario?", icon: "warning", showCancelButton: true, confirmButtonText: "Sí, eliminar" });',
        '    if (result.isConfirmed) {',
        '      try {',
        '        await api.deleteUsuario(id);',
        '        loadUsuarios();',
        '      } catch (err) { Swal.fire({ icon: "error", title: "Error", text: err.message }); }',
        '    }',
        '  };'
    ]);
}

// 5. Add Users Tab Button
if (!content.includes("tab === 'usuarios'")) {
    insertBefore("className={`btn ${tab === 'import' ? 'btn-primary' : 'btn-outline'}`}", [
        '                    <button',
        '                      className={`btn ${tab === \'usuarios\' ? \'btn-primary\' : \'btn-outline\'}`}',
        '                      style={{ borderColor: \'#3b82f6\', color: tab === \'usuarios\' ? \'white\' : \'#3b82f6\', background: tab === \'usuarios\' ? \'#3b82f6\' : \'transparent\' }}',
        '                      onClick={() => { setTab(\'usuarios\'); loadUsuarios(); }}',
        '                    >',
        '                      <Users size={16} /> Usuarios',
        '                    </button>'
    ]);
}

// 6. Add Users Tab Content
const usersTabContent = `
                {tab === 'usuarios' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div>
                        <h3><Users size={20} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Gestión de Usuarios</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administrá los usuarios que pueden acceder al sistema.</p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          setEditingUser({ usuario: '', password: '', nombre: '', rol: 'admin', estado: 1 });
                          setIsEditingUser(true);
                        }}
                      >
                        <UserPlus size={18} /> Nuevo Usuario
                      </button>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ID</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Usuario</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rol</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Estado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.id}</td>
                              <td style={{ padding: '1rem' }}>{u.usuario}</td>
                              <td style={{ padding: '1rem' }}>{u.nombre}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>
                                  {u.rol}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {u.estado == 1 ? 
                                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Activo</span> : 
                                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Inactivo</span>
                                }
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <button className="btn btn-outline btn-small" onClick={() => { setEditingUser({ ...u, password: '' }); setIsEditingUser(true); }} style={{ marginRight: '0.5rem', padding: '0.4rem' }}>
                                  <Edit3 size={16} />
                                </button>
                                <button className="btn btn-outline btn-small" onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '0.4rem' }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {usuarios.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay usuarios creados</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
`;

if (!content.includes("{tab === 'usuarios' && (")) {
    const importTabIdx = lines.findIndex(l => l.includes("{tab === 'import' && <ImportManager"));
    if (importTabIdx !== -1) {
        lines.splice(importTabIdx, 0, ...usersTabContent.split('\\n'));
    }
}

const userModalContent = \`
      {isEditingUser && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingUser.id ? <Edit3 size={20} /> : <UserPlus size={20} />} 
                {editingUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsEditingUser(false)} className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Nombre de Usuario</label>
                <input type="text" value={editingUser.usuario} onChange={(e) => setEditingUser({...editingUser, usuario: e.target.value})} placeholder="Ej: admin123" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Nombre Completo</label>
                <input type="text" value={editingUser.nombre} onChange={(e) => setEditingUser({...editingUser, nombre: e.target.value})} placeholder="Ej: Juan Perez" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>{editingUser.id ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</label>
                <input type="password" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} placeholder="***" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Rol</label>
                <select value={editingUser.rol} onChange={(e) => setEditingUser({...editingUser, rol: e.target.value})}>
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Estado</label>
                <select value={editingUser.estado} onChange={(e) => setEditingUser({...editingUser, estado: parseInt(e.target.value)})}>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsEditingUser(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveUser}><Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
\`;

if (!content.includes('isEditingUser && (')) {
    const modalsEndIdx = lines.findIndex(l => l.includes('{showBankPicker && ('));
    if (modalsEndIdx !== -1) {
        lines.splice(modalsEndIdx, 0, ...userModalContent.split('\\n'));
    }
}

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log("Admin.jsx updated successfully");
