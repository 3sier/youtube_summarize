import transcriptModule from "./modules/transcriptModule.js";
import uiModule from "./modules/uiModule.js";
import {
  isYouTubeVideoPage,
  getTranscript,
  summarizeTranscript,
} from "./utils.js";

window.getTranscript = getTranscript;
window.summarizeTranscript = summarizeTranscript;

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  uiModule.createTranscriptUI();

  setupEventListeners();

  transcriptModule.checkYouTubeAndUpdateUI();
}

function setupEventListeners() {
  const extractButton = document.getElementById("extract-transcript-btn");
  if (extractButton) {
    extractButton.addEventListener(
      "click",
      transcriptModule.extractAndDisplayTranscript
    );
  }
}

export { initializeApp };
