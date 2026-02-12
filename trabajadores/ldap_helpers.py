from ldap3 import Server, Connection, SIMPLE, ALL
from django.conf import settings
from contextlib import contextmanager

# El "Motor" de Conexiin (prueba con lo del pantalla_touch)
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

# función buscar persona¿¿
def buscar_usuario(nombre_usuario="*"):
    # El filtro debe ser una cadena limpia sin saltos de línea internos
    if nombre_usuario == "*":
        filtro = "(sAMAccountName=*)"
    else:
        filtro = f"(sAMAccountName=*{nombre_usuario}*)"
    
    with get_ldap_connection() as conn:
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=filtro,
            attributes=['givenName', 'sn', 'mail', 'title'],
            size_limit=800
        )
        return [
            {
                'nombre': str(e.givenName) if 'givenName' in e else "N/A",
                'apellido': str(e.sn) if 'sn' in e else "N/A",
                'email': str(e.mail) if 'mail' in e else "N/A",
                'cargo': str(e.title) if 'title' in e else "N/A",
            } for e in conn.entries
        ]