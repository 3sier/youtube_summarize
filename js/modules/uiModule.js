const transcriptStyles = `
  .transcript-container {
    max-width: 800px;
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

  const transcriptContainer = document.getElementById("transcript-container");
  if (transcriptContainer) {
    transcriptContainer.appendChild(container);
  } else {
    document.querySelector(".main-container").appendChild(container);
  }

  addStylesToHead(transcriptStyles);
}

function addStylesToHead(stylesText) {
  const style = document.createElement("style");
  style.textContent = stylesText;
  document.head.appendChild(style);
}

export default {
  createTranscriptUI,
  addStylesToHead,
};
