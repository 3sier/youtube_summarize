async function extractAndDisplayTranscript() {
  const transcriptResult = document.getElementById("transcript-result");
  const summaryResult = document.getElementById("summary-result");

  transcriptResult.style.display = "block";
  transcriptResult.innerHTML =
    '<div class="loading">Extrayendo transcripción...</div>';

  try {
    if (!window.location.href.includes("youtube.com/watch")) {
      throw new Error(
        "Esta función solo funciona en páginas de videos de YouTube"
      );
    }

    const transcript = await getTranscript();

    transcriptResult.innerHTML = transcript;

    summaryResult.style.display = "block";
    summaryResult.innerHTML = '<div class="loading">Generando resumen...</div>';

    const apiKey = await getApiKey();

    const summary = await summarizeTranscript(transcript, apiKey);

    summaryResult.innerHTML = summary;
  } catch (error) {
    transcriptResult.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    summaryResult.style.display = "none";
  }
}

async function getApiKey() {
  return prompt(
    "Por favor, ingresa tu API Key de OpenAI para resumir la transcripción:"
  );
}

function getVideoTitle() {
  return document.title.replace(" - YouTube", "");
}

function checkYouTubeAndUpdateUI() {
  const isYouTube = window.location.href.includes("youtube.com/watch");
  const container = document.querySelector(".transcript-container");

  if (container) {
    if (isYouTube) {
      container.style.display = "block";
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

export default {
  extractAndDisplayTranscript,
  checkYouTubeAndUpdateUI,
  getVideoTitle,
};
