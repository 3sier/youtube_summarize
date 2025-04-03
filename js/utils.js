// Utils Module - Contains utility functions used across modules

/**
 * Checks if a URL is a YouTube video page
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is a YouTube video page
 */
function isYouTubeVideoPage(url) {
  return url.includes("youtube.com/watch");
}

/**
 * Gets a transcript from the current YouTube video
 * This function should be defined elsewhere (like in content.js)
 * This is just a stub to avoid errors
 * @returns {Promise<string>} - The transcript text
 */
async function getTranscript() {
  // In a real implementation, this would call the YouTube API
  // or use another method to extract the transcript
  throw new Error(
    "La función getTranscript() debe ser implementada en content.js"
  );
}

/**
 * Summarizes a transcript using the OpenAI API
 * @param {string} transcript - The transcript to summarize
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<string>} - The summary
 */
async function summarizeTranscript(transcript, apiKey) {
  // In a real implementation, this would call the OpenAI API
  // For now, we'll just return a placeholder
  return "Este es un resumen de ejemplo. La implementación real utilizaría la API de OpenAI para generar un resumen del contenido del video.";
}

// Export utility functions
export { isYouTubeVideoPage, getTranscript, summarizeTranscript };
