import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from email.mime.base import MIMEBase
from email import encoders
from trabajadores.ldap_helpers import buscar_usuario 

class Command(BaseCommand):
    help = 'Envía correos automáticos únicamente a los cumpleañeros del día de hoy'

    def handle(self, *args, **options):
        # 1. Obtener todos los trabajadores del LDAP
        self.stdout.write("Buscando trabajadores en LDAP...")
        trabajadores = buscar_usuario("*")
        
        # 2. Definir fecha de interés (solo hoy)
        hoy = datetime.now().strftime("%d/%m") # Ej: "17/02"
        
        cumpleañeros = []
        for t in trabajadores:
            # El campo 'cumpleanos' viene de 'postalCode' en tu LDAP
            fecha_str = t.get('cumpleanos', '')
            
            # Verificamos si la fecha de hoy está contenida en la cadena del LDAP
            if fecha_str and hoy in fecha_str:
                cumpleañeros.append(t)

        if not cumpleañeros:
            self.stdout.write(self.style.SUCCESS(f"No hay cumpleaños hoy ({hoy})."))
            return

        # 3. Lógica de envío de correos
        self.stdout.write(f"Enviando correos a {len(cumpleañeros)} personas...")
        self.enviar_correos(cumpleañeros)

    def enviar_correos(self, cumpleañeros):
        asunto = "🎂 ¡Feliz Cumpleaños!"
        remitente = settings.EMAIL_HOST_USER
        ruta_gif = os.path.join(settings.BASE_DIR, 'static', 'cumple_indef.gif')

        try:
            connection = get_connection()
            connection.open()

            for t in cumpleañeros:
                email = t.get('email')
                nombre = t.get('nombre', 'Compañero/a')
                
                if not email or email == "Sin correo":
                    continue

                html_content = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center;">
                        <h2 style="color: #2c3e50;">¡Feliz Cumpleaños, {nombre}! 🎂</h2>
                        <p>Te deseamos lo mejor en tu día de parte de todo el equipo.</p>
                        <img src="cid:gif_animado" style="width: 100%; max-width: 500px;">
                    </body>
                </html>
                """
                
                msg = EmailMultiAlternatives(asunto, f"¡Feliz cumple {nombre}!", remitente, [email], connection=connection)
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
                self.stdout.write(self.style.SUCCESS(f"Correo enviado exitosamente a: {email}"))

            connection.close()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error crítico enviando correos: {e}"))