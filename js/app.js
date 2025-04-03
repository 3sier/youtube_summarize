// Main Application File
import characterModule from "./modules/characterModule.js";
import transcriptModule from "./modules/transcriptModule.js";
import uiModule from "./modules/uiModule.js";
import {
  isYouTubeVideoPage,
  getTranscript,
  summarizeTranscript,
} from "./utils.js";

// Make utilities available globally for other modules
window.getTranscript = getTranscript;
window.summarizeTranscript = summarizeTranscript;

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

// Main initialization function
function initializeApp() {
  // Create the transcript UI
  uiModule.createTranscriptUI();

  // Initialize character display
  characterModule.displayCharacters();

  // Setup event listeners for transcript extraction
  setupEventListeners();

  // Check if we're on YouTube and update UI accordingly
  transcriptModule.checkYouTubeAndUpdateUI();
}

// Setup event listeners
function setupEventListeners() {
  const extractButton = document.getElementById("extract-transcript-btn");
  if (extractButton) {
    extractButton.addEventListener(
      "click",
      transcriptModule.extractAndDisplayTranscript
    );
  }
}

// Export app initialization for potential use in other scripts
export { initializeApp };
