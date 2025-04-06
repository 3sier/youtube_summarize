function isYouTubeVideoPage(url) {
  return url.includes("youtube.com/watch");
}

async function getTranscript() {
  throw new Error(
    "La función getTranscript() debe ser implementada en content.js"
  );
}

async function summarizeTranscript(transcript, apiKey) {
  return "Este es un resumen de ejemplo. La implementación real utilizaría la API de OpenAI para generar un resumen del contenido del video.";
}

export { isYouTubeVideoPage, getTranscript, summarizeTranscript };
