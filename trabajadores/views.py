from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings
from django.db.models import Q
from .models import Trabajador 
# 1. CORREGIDO: Importamos desde .serializer (nombre de tu archivo)
# y traemos la clase TrabajadorSerializer (nombre de la clase)
from .serializer import TrabajadorSerializer 
from .ldap_helpers import buscar_usuario
from email.mime.base import MIMEBase
from email import encoders
import os

@api_view(['GET'])
def lista_trabajadores(request):
    """
    Vista que obtiene trabajadores usando el Serializador para incluir 
    Jefatura (nombre limpio), Cargo y Gerencia.
    """
    query = request.GET.get('q', '').strip()
    
    # Buscamos en la base de datos local para aprovechar el Serializer estructurado
    if query:
        # Filtro potente: busca en nombre, apellido, cargo, nombre de gerencia o nombre de jefe
        trabajadores = Trabajador.objects.filter(
            Q(nombre__icontains=query) | 
            Q(apellido__icontains=query) | 
            Q(cargo__icontains=query) |
            Q(departamento__nombre__icontains=query) |
            Q(reporta_a__nombre__icontains=query)
        )
    else:
        trabajadores = Trabajador.objects.all()

    # 2. CORREGIDO: Usamos la clase 'TrabajadorSerializer' (singular), no 'TrabajadorSerializers'
    serializer = TrabajadorSerializer(trabajadores, many=True)

    return Response({
        'total': trabajadores.count(),
        'trabajadores': serializer.data
    })

@api_view(['POST'])
def enviar_correos_seleccionados(request):
    """
    Envía correos personalizados con un GIF animado embebido.
    """
    usuarios_seleccionados = request.data.get('usuarios', [])
    
    if not usuarios_seleccionados:
        return Response({'error': 'No has seleccionado a nadie.'}, status=400)

    asunto = "🎂 ¡Feliz Cumpleaños!"
    remitente = settings.EMAIL_HOST_USER
    ruta_gif = os.path.join(settings.BASE_DIR, 'static', 'cumple_indef.gif')

    enviados = 0
    errores = []

    try:
        connection = get_connection()
        connection.open()

        for usuario in usuarios_seleccionados:
            email = usuario.get('email')
            nombre = usuario.get('nombre', 'Compañero/a')
            
            try:
                html_content = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center;">
                        <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #2c3e50;">¡Feliz Cumpleaños, {nombre}! 🎂</h2>
                            <p>Hola <b>{nombre}</b>,</p>
                            <p>Te enviamos este saludo especial con mucha alegría en tu día.</p>
                            <div style="margin-top: 20px;">
                                <img src="cid:gif_animado" alt="¡Felicidades!" style="width: 100%; max-width: 500px; border-radius: 8px;">
                            </div>
                            <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
                                Que tengas un excelente día.
                            </p>
                        </div>
                    </body>
                </html>
                """
                
                msg = EmailMultiAlternatives(
                    asunto,
                    f"¡Feliz cumpleaños {nombre}!", 
                    remitente,
                    [email],
                    connection=connection
                )
                msg.attach_alternative(html_content, "text/html")
                msg.mixed_subtype = 'related'

                if os.path.exists(ruta_gif):
                    with open(ruta_gif, 'rb') as f:
                        part = MIMEBase('image', 'gif')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header('Content-ID', '<gif_animado>')
                        part.add_header('Content-Disposition', 'inline', filename='cumple_indef.gif')
                        msg.attach(part)
                
                msg.send()
                enviados += 1

            except Exception as e:
                errores.append(f"Error con {email}: {str(e)}")

        connection.close()
        
    except Exception as e:
        return Response({'error': f'Error de conexión: {str(e)}'}, status=500)

    return Response({
        'mensaje': f'Se enviaron {enviados} saludos animados correctamente.',
        'errores': errores
    })