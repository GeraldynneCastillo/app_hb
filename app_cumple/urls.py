from django.contrib import admin
from django.urls import path
from trabajadores.views import lista_trabajadores

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/', lista_trabajadores),
]
