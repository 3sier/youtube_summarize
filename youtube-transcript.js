// Function to observe changes in the DOM to detect when transcription panel is opened
function observeTranscriptButton() {
  // YouTube's transcript button usually has this specific class or is inside a container with these classes
  const transcriptButtonObserver = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      // Look for the transcript button
      const transcriptButton = document.querySelector(
        'button[aria-label*="transcript"], .ytp-transcript-button'
      );

      if (
        transcriptButton &&
        !transcriptButton.hasAttribute("data-listener-added")
      ) {
        console.log("Transcript button found, adding click listener");

        // Add click event listener to the transcript button
        transcriptButton.addEventListener("click", () => {
          console.log("Transcript button clicked");

          // Wait for the transcript panel to appear
          setTimeout(captureTranscript, 1000);
        });

        // Mark the button as having a listener to avoid adding multiple listeners
        transcriptButton.setAttribute("data-listener-added", "true");
      }
    });
  });

  // Start observing the entire document for changes
  transcriptButtonObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("Observing for transcript button...");
}

// Function to capture the transcript content
function captureTranscript() {
  // The transcript panel container might have various selectors depending on YouTube's current implementation
  const transcriptPanel = document.querySelector(
    '.ytd-transcript-renderer, .ytd-transcript-search-panel-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
  );

  if (transcriptPanel) {
    console.log("Transcript panel found");

    // Get the HTML content of the transcript panel
    const transcriptHTML = transcriptPanel.outerHTML;

    // Log the HTML for debugging
    console.log("Transcript HTML captured");

    // Extract text content from the transcript
    const transcriptText = extractTranscriptText(transcriptPanel);

    // Create a result object with both HTML and extracted text
    const result = {
      html: transcriptHTML,
      text: transcriptText,
    };

    // Save or use the transcript as needed
    saveTranscript(result);

    // Notify the background script
    chrome.runtime.sendMessage({
      action: "transcriptCaptured",
      data: result,
    });
  } else {
    console.log("Transcript panel not found, will try again in 1 second");

    // Try again after a short delay
    setTimeout(captureTranscript, 1000);
  }
}

// Function to extract text content from the transcript panel
function extractTranscriptText(transcriptPanel) {
  // The transcript items are usually in a list with timestamp and text segments
  const transcriptItems = transcriptPanel.querySelectorAll(
    ".ytd-transcript-segment-renderer, .segment-text, ytd-transcript-segment-renderer"
  );
  let transcriptText = "";

  if (transcriptItems.length > 0) {
    transcriptItems.forEach((item) => {
      transcriptText += item.textContent.trim() + "\n";
    });
  } else {
    // If no items found with the common selectors, try to get all text content
    transcriptText = transcriptPanel.textContent.trim();
  }

  return transcriptText;
}

// Function to save or use the transcript
function saveTranscript(transcriptData) {
  // Here you can implement whatever you want to do with the transcript
  console.log("Full transcript captured");

  // Example: Copy transcript text to clipboard
  navigator.clipboard
    .writeText(transcriptData.text)
    .then(() => {
      console.log("Transcript copied to clipboard!");
      // Show a notification or feedback to the user
      showNotification("Transcript copied to clipboard!");
    })
    .catch((err) => {
      console.error("Could not copy transcript: ", err);
    });
}

// Function to show a simple notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4285f4;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s";

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkTranscript") {
    // Check if transcript button is available
    const transcriptButton = document.querySelector(
      'button[aria-label*="transcript"], .ytp-transcript-button'
    );

    if (transcriptButton) {
      sendResponse({ transcriptAvailable: true });
    } else {
      sendResponse({ transcriptAvailable: false });
    }
  } else if (request.action === "ping") {
    // Simple ping to check if content script is loaded
    sendResponse({ status: "active" });
  }

  // Return true to indicate we'll respond asynchronously
  return true;
});

// Initialize everything when the page is loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  // Document already loaded
  observeTranscriptButton();
} else {
  // Wait for document to load
  document.addEventListener("DOMContentLoaded", () => {
    observeTranscriptButton();
  });
}

// Also run when YouTube's page navigation happens (it's a SPA)
window.addEventListener("yt-navigate-finish", () => {
  if (window.location.pathname.includes("/watch")) {
    console.log("YouTube video page detected, initializing transcript capture");
    observeTranscriptButton();
  }
});
