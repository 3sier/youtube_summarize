# YouTube Resumen

Aplicación para extraer y resumir transcripciones de YouTube, además de mostrar una galería de personajes.

## Estructura del Proyecto

El proyecto ha sido modularizado para mejorar su mantenibilidad y escalabilidad:

```
youtube_resumen/
├── js/
│   ├── modules/
│   │   ├── characterModule.js    # Módulo para manejo de personajes
│   │   ├── transcriptModule.js   # Módulo para extracción de transcripciones
│   │   └── uiModule.js           # Módulo para creación de interfaz
│   ├── utils.js                  # Funciones de utilidad generales
│   └── app.js                    # Archivo principal de la aplicación
├── index.html                    # Página principal
├── styles.css                    # Estilos CSS
├── webpack.config.js             # Configuración de Webpack
└── package.json                  # Dependencias del proyecto
```

## Funcionalidades

- **Galería de Personajes**: Muestra una galería de personajes que al hacer clic muestra detalles como nombre, especie y género.
- **Extractor de Transcripciones**: Permite extraer y resumir transcripciones de videos de YouTube.

## Instalación

1. Clona este repositorio
2. Instala las dependencias:
   ```
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```
   npm start
   ```

## Desarrollo

Para construir la aplicación para producción:

```
npm run build
```

Para ejecutar en modo desarrollo con recarga automática:

```
npm start
```

## Módulos

### characterModule.js

Maneja la visualización y los datos de los personajes.

### transcriptModule.js

Gestiona la extracción y procesamiento de transcripciones de YouTube.

### uiModule.js

Contiene funciones para crear y estilizar la interfaz de usuario.

### utils.js

Proporciona funciones de utilidad usadas en múltiples módulos.

### app.js

Inicializa la aplicación y coordina la comunicación entre módulos.
