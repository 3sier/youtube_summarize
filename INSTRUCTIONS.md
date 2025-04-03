# Instrucciones para Ejecutar la Aplicación

## Requisitos Previos

Asegúrate de tener instalado Node.js y npm en tu sistema. Puedes verificarlo ejecutando:

```
node -v
npm -v
```

## Instalación

1. Clona o descarga este repositorio
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias ejecutando:

```
npm install
```

## Ejecución

Hay dos formas de ejecutar la aplicación:

### 1. Servidor de Desarrollo

Para iniciar el servidor de desarrollo con recarga automática:

```
npm start
```

Esto abrirá automáticamente la aplicación en tu navegador en `http://localhost:9000`

### 2. Compilación para Producción

Para compilar la aplicación para producción:

```
npm run build
```

Esto generará los archivos optimizados en la carpeta `dist/`.

## Estructura de Archivos

La aplicación ha sido modularizada para mejorar su mantenibilidad:

- `js/modules/characterModule.js` - Gestión de personajes
- `js/modules/transcriptModule.js` - Extracción de transcripciones
- `js/modules/uiModule.js` - Interfaz de usuario
- `js/utils.js` - Funciones de utilidad
- `js/app.js` - Archivo principal

## Funcionalidades

1. **Galería de Personajes**:

   - Al hacer clic en un personaje se mostrará una ventana modal con detalles
   - Los detalles incluyen: nombre, especie y género

2. **Extracción de Transcripciones de YouTube**:
   - Funciona cuando estás en una página de video de YouTube
   - Extrae y muestra la transcripción
   - Puede generar un resumen del contenido
