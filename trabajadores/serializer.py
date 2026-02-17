from rest_framework import serializers
from .models import Trabajador, Departamento

class DepartamentoSerializer(serializers.ModelSerializer):
    """Mapea la información de la Gerencia."""
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion']

class TrabajadorResumenSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para Jefaturas y Equipos.
    Crea el campo 'nombre_completo' que busca tu App.jsx.
    """
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Trabajador
        fields = ['id', 'nombre_completo', 'cargo', 'foto', 'email']

    def get_nombre_completo(self, obj):
        # Une nombre y apellido para que React no tenga que hacerlo
        return f"{obj.nombre} {obj.apellido}"

class TrabajadorSerializer(serializers.ModelSerializer):
    """
    Serializer principal.
    Aquí es donde 'reporta_a' se convierte en el objeto 'jefe_directo'.
    """
    # 1. Gerencia: Convierte el ID del departamento en un objeto con nombre
    gerencia_info = DepartamentoSerializer(source='departamento', read_only=True)
    
    # 2. Jefatura: Convierte el ID de 'reporta_a' en un objeto con nombre_completo
    jefe_directo = TrabajadorResumenSerializer(source='reporta_a', read_only=True)
    
    # 3. Equipo: Lista a las personas que supervisa este trabajador
    equipo_a_cargo = TrabajadorResumenSerializer(source='subordinados', many=True, read_only=True)

    class Meta:
        model = Trabajador
        fields = [
            'id', 'nombre', 'apellido', 
            'cargo',         # <--- IMPORTANTE: Este campo debe estar aquí para que se vea el cargo
            'email', 'telefono', 'foto', 'cuenta_activa', 
            'departamento',  # ID para escritura
            'gerencia_info', # Objeto para lectura
            'reporta_a',     # ID para escritura
            'jefe_directo',  # Objeto para lectura
            'equipo_a_cargo' # Lista para lectura
        ]