from ldap3 import Server, Connection, SIMPLE, ALL
from django.conf import settings
from contextlib import contextmanager

@contextmanager
def get_ldap_connection():
    server = Server(
        settings.LDAP_CONFIG['HOST'],
        port=settings.LDAP_CONFIG['PORT'],
        get_info=ALL
    )
    conn = Connection(
        server,
        user=settings.LDAP_CONFIG['USER_DN'],
        password=settings.LDAP_CONFIG['PASSWORD'],
        authentication=SIMPLE,
        auto_bind=True
    )
    try:
        yield conn
    finally:
        conn.unbind()

def buscar_usuario(nombre_usuario="*"):
    # 1. Filtro de Seguridad: Personas, Usuarios y Cuentas Activas
    seguridad = "(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
    
    # 2. Filtro de Identidad: Solo gente con correo @cmf.cl y que tengan un Cargo definido
    # Esto es mucho más efectivo que excluir OUs manuales
    identidad_cmf = "(&(mail=*@cmf.cl)(title=*))"
    
    # 3. Filtro de búsqueda por nombre
    if nombre_usuario == "*" or not nombre_usuario:
        nombre_f = "(sAMAccountName=*)"
    else:
        nombre_f = f"(|(sAMAccountName=*{nombre_usuario}*)(givenName=*{nombre_usuario}*)(sn=*{nombre_usuario}*))"
    
    # 4. Filtro de limpieza (evitar nulos)
    limpieza = "(&(givenName=*)(sn=*))"

    # CONSTRUCCIÓN FINAL: Todo debe cumplirse (operador &)
    filtro_final = f"(&{seguridad}{identidad_cmf}{nombre_f}{limpieza})"

    with get_ldap_connection() as conn:
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=filtro_final,
            attributes=['givenName', 'sn', 'mail', 'title'],
            size_limit=999 
        )
        
        resultados = []
        for e in conn.entries:
            def obtener_valor(atributo):
                # Extraemos el valor real evitando los corchetes []
                if atributo in e and len(e[atributo].values) > 0:
                    return str(e[atributo].values[0])
                return ""

            resultados.append({
                'nombre': obtener_valor('givenName'),
                'apellido': obtener_valor('sn'),
                'email': obtener_valor('mail') or "Sin correo",
                'cargo': obtener_valor('title') or "Colaborador",
            })
            
        return resultados