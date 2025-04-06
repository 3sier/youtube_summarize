# Instrucciones para la Extensión de YouTube Resumen

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

Hay dos formas de trabajar con la extensión:

### 1. Modo Desarrollo

Para iniciar el servidor de desarrollo con recarga automática:

```
npm start
```

Esto abrirá automáticamente la aplicación en tu navegador en `http://localhost:9000`.
Ten en cuenta que algunas funcionalidades específicas de la extensión pueden no funcionar correctamente fuera del entorno de Chrome.

### 2. Compilación para Producción

Para compilar la extensión para producción:

```
npm run build
```

Esto generará los archivos optimizados en la carpeta `dist/`.

### 3. Carga en Chrome

Para cargar la extensión en Chrome:

1. Abre Chrome y navega a `chrome://extensions/`
2. Habilita el "Modo desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar desempaquetada"
4. Selecciona la carpeta `dist` de tu proyecto

## Estructura de Archivos

La extensión ha sido modularizada para mejorar su mantenibilidad:

- `js/modules/transcriptModule.js` - Extracción de transcripciones
- `js/modules/uiModule.js` - Interfaz de usuario
- `js/utils.js` - Funciones de utilidad
- `js/app.js` - Archivo principal

## Funcionalidades

**Extracción de Transcripciones de YouTube**:

- Funciona cuando estás en una página de video de YouTube
- Extrae y muestra la transcripción del video
- Puede generar un resumen del contenido utilizando la API de OpenAI
