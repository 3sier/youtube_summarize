// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Transcriber & Summarizer extension installed");
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the URL is a YouTube video and the page has loaded
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch")
  ) {
    // Inject the content script
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["youtube-transcript.js"],
      })
      .then(() => {
        console.log("Content script injected into YouTube video page");
      })
      .catch((err) => {
        console.error("Error injecting content script:", err);
      });
  }
});

// Function to handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);

  if (request.action === "checkTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        tabs.length > 0 &&
        tabs[0].url &&
        (tabs[0].url.includes("youtube.com/watch") ||
          tabs[0].url.includes("m.youtube.com/watch"))
      ) {
        sendResponse({ valid: true });
      } else {
        sendResponse({ valid: false });
      }
    });
    return true; // Indicates we'll respond asynchronously
  }

  if (request.action === "transcriptCaptured") {
    console.log("Transcript captured in tab:", sender.tab.id);

    // You can store the transcript data or perform other actions here
    if (request.data) {
      console.log("Transcript data received");

      // Optionally save to storage
      chrome.storage.local.set(
        {
          lastTranscript: request.data,
          captureTime: new Date().toISOString(),
          videoUrl: sender.tab.url,
        },
        () => {
          console.log("Transcript saved to storage");
        }
      );
    }
  }

  if (request.action === "getApiKey") {
    // Obtener la API key del almacenamiento
    chrome.storage.sync.get(["apiKey"], (result) => {
      console.log(
        "API Key en background:",
        result.apiKey ? "Presente" : "No encontrada"
      );
      sendResponse({ apiKey: result.apiKey });
    });
    return true; // Mantener el canal de mensajes abierto para la respuesta asíncrona
  }

  // Always return true if you want to use sendResponse asynchronously
  return true;
});
