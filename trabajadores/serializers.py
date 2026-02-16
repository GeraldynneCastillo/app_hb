from rest_framework import serializers
from .models import Trabajador, Departamento

class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para la información de Gerencia."""
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion', 'contacto_email', 'contacto_telefono']

class TrabajadorResumenSerializer(serializers.ModelSerializer):
    """Serializer ligero para listas o referencias de jefatura/colegas."""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Trabajador
        fields = ['id', 'nombre_completo', 'cargo', 'foto', 'email']

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.apellido}"

class TrabajadorSerializer(serializers.ModelSerializer):
    """Serializer principal con toda la jerarquía integrada."""
    # Representaciones de solo lectura para el frontend
    gerencia_info = DepartamentoSerializer(source='departamento', read_only=True)
    jefe_directo = TrabajadorResumenSerializer(source='reporta_a', read_only=True)
    equipo_a_cargo = TrabajadorResumenSerializer(source='subordinados', many=True, read_only=True)

    class Meta:
        model = Trabajador
        fields = [
            'id', 'nombre', 'apellido',     'cargo', 'email', 'telefono', 
            'foto', 'cuenta_activa', 'departamento', 'gerencia_info',
            'reporta_a', 'jefe_directo', 'equipo_a_cargo'
        ]
        # 'departamento' y 'reporta_a' (IDs) se usan para escribir datos
        # 'gerencia_info' y 'jefe_directo' (objetos) se usan para leer datos en React