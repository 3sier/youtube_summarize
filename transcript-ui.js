// Transcript UI Integration
document.addEventListener("DOMContentLoaded", function () {
  // Create the UI container
  createTranscriptUI();

  // Initialize character display
  displayCharacters();

  // Setup event listeners for transcript extraction
  const extractButton = document.getElementById("extract-transcript-btn");
  if (extractButton) {
    extractButton.addEventListener("click", extractAndDisplayTranscript);
  }

  // Check if we're on YouTube
  checkYouTubeAndUpdateUI();
});

// Function to check if we're on YouTube and update UI accordingly
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

// Function to create the UI for transcript extraction
function createTranscriptUI() {
  const container = document.createElement("div");
  container.className = "transcript-container";
  container.innerHTML = `
        <div class="transcript-controls">
            <h2>Extractor de Transcripciones</h2>
            <button id="extract-transcript-btn" class="action-button">Extraer Transcripción</button>
        </div>
        <div id="transcript-result" class="transcript-result"></div>
        <div id="summary-result" class="summary-result"></div>
    `;

  document.body.insertBefore(
    container,
    document.querySelector(".character-grid").parentNode
  );

  // Add styles to head
  const style = document.createElement("style");
  style.textContent = `
        .transcript-container {
            max-width: 1200px;
            margin: 0 auto 30px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .transcript-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .action-button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .action-button:hover {
            background-color: #2980b9;
        }
        
        .transcript-result {
            max-height: 300px;
            overflow-y: auto;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            display: none;
        }
        
        .summary-result {
            padding: 15px;
            background-color: #e8f4f8;
            border-radius: 5px;
            font-size: 16px;
            line-height: 1.6;
            display: none;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #777;
        }
        
        .youtube-detected {
            background-color: #e6f7ff;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin-bottom: 20px;
            border-radius: 0 5px 5px 0;
        }
        
        .youtube-detected p {
            margin: 5px 0;
        }
        
        .youtube-detected strong {
            color: #2c3e50;
        }
    `;
  document.head.appendChild(style);
}

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

    // Get API key (this would need to be provided by the user in a real extension)
    // For demo purposes, you'd need to implement proper API key handling
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

// Datos de personajes de ejemplo
const characters = [
  {
    id: 1,
    name: "Rick Sanchez",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
  },
  {
    id: 2,
    name: "Morty Smith",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg",
  },
  {
    id: 3,
    name: "Summer Smith",
    species: "Humano",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg",
  },
  {
    id: 4,
    name: "Beth Smith",
    species: "Humano",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/4.jpeg",
  },
  {
    id: 5,
    name: "Jerry Smith",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/5.jpeg",
  },
  {
    id: 6,
    name: "Abadango Cluster Princess",
    species: "Alien",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/6.jpeg",
  },
  {
    id: 7,
    name: "Abradolf Lincler",
    species: "Humano Híbrido",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/7.jpeg",
  },
  {
    id: 8,
    name: "Adjudicator Rick",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/8.jpeg",
  },
];

// Elementos del DOM para la galería de personajes
let characterGrid;
let modal;
let modalBody;
let closeButton;

// Función para inicializar elementos DOM
function initDOMElements() {
  characterGrid = document.getElementById("character-grid");
  modal = document.getElementById("character-modal");
  modalBody = document.getElementById("modal-body");
  closeButton = document.getElementById("close-modal");

  // Cerrar el modal
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar el modal al hacer clic fuera del contenido
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Función para crear y mostrar las tarjetas de personajes
function displayCharacters() {
  initDOMElements();

  if (!characterGrid) return;

  characterGrid.innerHTML = "";

  characters.forEach((character) => {
    const card = document.createElement("div");
    card.className = "character-card";
    card.dataset.id = character.id;

    card.innerHTML = `
            <img src="${character.image}" alt="${character.name}" class="character-image">
            <div class="character-name">${character.name}</div>
        `;

    card.addEventListener("click", () => showCharacterDetails(character));
    characterGrid.appendChild(card);
  });
}

// Función para mostrar los detalles del personaje en el modal
function showCharacterDetails(character) {
  if (!modalBody || !modal) return;

  modalBody.innerHTML = `
        <div class="character-info">
            <img src="${character.image}" alt="${character.name}" class="modal-image">
            <h2>${character.name}</h2>
            <p><span class="info-label">Especie:</span> ${character.species}</p>
            <p><span class="info-label">Género:</span> ${character.gender}</p>
        </div>
    `;

  modal.style.display = "flex";
}
