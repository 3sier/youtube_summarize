// Transcript Module - Manages transcript extraction and handling

// Function to extract and display transcript
async function extractAndDisplayTranscript() {
  const transcriptResult = document.getElementById("transcript-result");
  const summaryResult = document.getElementById("summary-result");

  // Show loading state
  transcriptResult.style.display = "block";
  transcriptResult.innerHTML =
    '<div class="loading">Extrayendo transcripción...</div>';

  try {
    // Check if we're on YouTube
    if (!window.location.href.includes("youtube.com/watch")) {
      throw new Error(
        "Esta función solo funciona en páginas de videos de YouTube"
      );
    }

    // Get transcript using the function from content.js
    const transcript = await getTranscript();

    // Display transcript
    transcriptResult.innerHTML = transcript;

    // Now try to summarize
    summaryResult.style.display = "block";
    summaryResult.innerHTML = '<div class="loading">Generando resumen...</div>';

    // Get API key
    const apiKey = await getApiKey();

    // Summarize the transcript
    const summary = await summarizeTranscript(transcript, apiKey);

    // Display summary
    summaryResult.innerHTML = summary;
  } catch (error) {
    // Display error
    transcriptResult.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    summaryResult.style.display = "none";
  }
}

// Function to get API key (in a real extension, this would be stored in browser storage)
async function getApiKey() {
  // This is a placeholder. In a real extension, you'd get the API key from storage
  // For demo purposes, we'll just show a prompt. In a real app, NEVER do this.
  return prompt(
    "Por favor, ingresa tu API Key de OpenAI para resumir la transcripción:"
  );
}

// Function to get video title (assumed to be imported or defined elsewhere)
function getVideoTitle() {
  // This function would need to be implemented to extract the YouTube video title
  // For now, we'll return a placeholder
  return document.title.replace(" - YouTube", "");
}

// Check if we're on YouTube and update UI accordingly
function checkYouTubeAndUpdateUI() {
  const isYouTube = window.location.href.includes("youtube.com/watch");
  const container = document.querySelector(".transcript-container");

  if (container) {
    if (isYouTube) {
      // We're on YouTube, show the transcript extraction UI
      container.style.display = "block";
      // Add message that we're on YouTube
      const youtubeMessage = document.createElement("div");
      youtubeMessage.className = "youtube-detected";
      youtubeMessage.innerHTML = `
        <p>Detectado video de YouTube: <strong>${
          getVideoTitle() || "Video"
        }</strong></p>
        <p>Haz clic en "Extraer Transcripción" para obtener y resumir el contenido del video.</p>
      `;
      container.insertBefore(
        youtubeMessage,
        container.querySelector(".transcript-controls").nextSibling
      );
    } else {
      // Not on YouTube, hide the transcript extraction UI or show a message
      const controls = container.querySelector(".transcript-controls");
      if (controls) {
        controls.innerHTML = `
          <h2>Extractor de Transcripciones</h2>
          <p style="color: #777;">Esta función solo funciona en páginas de videos de YouTube.</p>
        `;
      }
    }
  }
}

// Export module functions
export default {
  extractAndDisplayTranscript,
  checkYouTubeAndUpdateUI,
  getVideoTitle,
};
