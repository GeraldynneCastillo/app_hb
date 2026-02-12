from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .ldap_helpers import buscar_usuario

def lista_trabajadores(request):
    # Buscamos a todos los usuarios (*) usando tu función de LDAP
    datos = buscar_usuario("*")
    
    # Devolvemos la respuesta en formato JSON para que se vea en la web
    return JsonResponse({'total': len(datos), 'trabajadores': datos})
