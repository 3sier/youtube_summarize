# YouTube Resumen

Extensión para Chrome que extrae y resume transcripciones de videos de YouTube usando la API de OpenAI.

## Características

- Extracción de transcripciones de videos de YouTube
- Resumen automático utilizando GPT-3.5 Turbo
- Soporte multilenguaje (Español, Inglés, Francés, Alemán, etc.)
- Modo claro/oscuro
- Rendimiento optimizado para no afectar la reproducción de YouTube
- Compatible con dispositivos móviles y de escritorio

## Estructura del Proyecto

```
youtube_resumen/
├── icons/                        # Iconos de la extensión
├── content.js                    # Script principal que se inyecta en YouTube
├── popup.js                      # Controlador de la ventana emergente
├── popup.html                    # Interfaz de la ventana emergente
├── youtube-transcript.js         # Módulo de extracción de transcripciones
├── background.js                 # Service worker en segundo plano
├── styles.css                    # Estilos CSS
├── manifest.json                 # Configuración de la extensión
├── webpack.config.js             # Configuración de Webpack (desarrollo)
└── package.json                  # Dependencias del proyecto
```

## Optimizaciones de Rendimiento

Esta extensión ha sido optimizada para minimizar el impacto en el rendimiento de YouTube:

- **Throttling y Debouncing**: Limita las llamadas a funciones para reducir la carga de CPU
- **Caching de elementos DOM**: Reduce las consultas repetidas al DOM
- **Selective Observers**: Solo observa partes específicas de la página en lugar de todo el documento
- **Timing eficiente**: Intervalos de recolección ajustados para evitar sobrecarga
- **Lazy Loading**: Carga componentes solo cuando son necesarios
- **Ejecución en `document_idle`**: Espera a que la página esté completamente cargada

## Instalación

### Desde el código fuente

1. Clona este repositorio
2. Instala las dependencias:
   ```
   npm install
   ```
3. Construye la extensión (opcional si deseas modificar el código):
   ```
   npm run build
   ```
4. Carga la extensión desempaquetada en Chrome:
   - Abre Chrome y navega a `chrome://extensions/`
   - Habilita el "Modo desarrollador"
   - Haz clic en "Cargar desempaquetada" y selecciona la carpeta del repositorio

## Uso

1. Navega a cualquier video de YouTube
2. Haz clic en el icono de la extensión
3. Ingresa tu API Key de OpenAI (se guardará para uso futuro)
4. Selecciona el idioma para el resumen
5. Haz clic en "Extraer y resumir"
6. El resumen se mostrará tanto en la ventana emergente como superpuesto en el video

## Desarrollo

Para construir la extensión en modo desarrollo con recarga automática:

```
npm start
```

## Requerimientos

- API Key de OpenAI (https://platform.openai.com/api-keys)
- Chrome 88 o superior

## Limitaciones

- Los videos sin transcripciones disponibles utilizarán los subtítulos automáticos, que pueden ser menos precisos
- Videos muy largos pueden requerir mayor tiempo de procesamiento
- Las API Keys de OpenAI tienen limitaciones de uso según tu plan
