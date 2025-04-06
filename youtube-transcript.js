const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const elementCache = {
  transcriptButton: null,
  transcriptPanel: null,
};

function observeTranscriptButton() {
  const transcriptButtonObserver = new MutationObserver(
    throttle((mutations) => {
      if (
        elementCache.transcriptButton &&
        elementCache.transcriptButton.hasAttribute("data-listener-added")
      ) {
        return;
      }

      const transcriptButton = document.querySelector(
        'button[aria-label*="transcript"], .ytp-transcript-button'
      );

      if (
        transcriptButton &&
        !transcriptButton.hasAttribute("data-listener-added")
      ) {
        console.log("Transcript button found, adding click listener");
        elementCache.transcriptButton = transcriptButton;

        transcriptButton.addEventListener("click", () => {
          console.log("Transcript button clicked");
          setTimeout(captureTranscript, 1000);
        });

        transcriptButton.setAttribute("data-listener-added", "true");
      }
    }, 500)
  );

  const observeTargets = [
    document.querySelector("#player"),
    document.querySelector("#below"),
    document.querySelector(".ytp-chrome-bottom"),
  ].filter(Boolean);

  if (observeTargets.length > 0) {
    observeTargets.forEach((target) => {
      transcriptButtonObserver.observe(target, {
        childList: true,
        subtree: true,
      });
    });
    console.log(
      `Observing ${observeTargets.length} specific targets for transcript button...`
    );
  } else {
    transcriptButtonObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: false,
    });
    console.log(
      "Observing document body for transcript button (fallback mode)..."
    );
  }
}

function captureTranscript() {
  if (elementCache.transcriptPanel) {
    console.log("Using cached transcript panel");
    processTranscriptPanel(elementCache.transcriptPanel);
    return;
  }

  const transcriptPanel = document.querySelector(
    '.ytd-transcript-renderer, .ytd-transcript-search-panel-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
  );

  if (transcriptPanel) {
    console.log("Transcript panel found");
    elementCache.transcriptPanel = transcriptPanel;
    processTranscriptPanel(transcriptPanel);
  } else {
    console.log("Transcript panel not found, will try again in 1 second");
    if (!window.captureRetries) window.captureRetries = 0;
    window.captureRetries++;

    if (window.captureRetries < 5) {
      setTimeout(captureTranscript, 1000);
    } else {
      console.log("Max retries reached, giving up on finding transcript panel");
      window.captureRetries = 0;
    }
  }
}

function processTranscriptPanel(panel) {
  const transcriptHTML = panel.outerHTML;

  const transcriptText = extractTranscriptText(panel);

  const result = {
    html: transcriptHTML,
    text: transcriptText,
  };

  saveTranscript(result);

  chrome.runtime.sendMessage({
    action: "transcriptCaptured",
    data: result,
  });
}

function extractTranscriptText(transcriptPanel) {
  const transcriptItems = transcriptPanel.querySelectorAll(
    ".ytd-transcript-segment-renderer, .segment-text, ytd-transcript-segment-renderer"
  );

  if (transcriptItems.length > 0) {
    const textArray = Array.from(transcriptItems).map((item) =>
      item.textContent.trim()
    );
    return textArray.join("\n");
  } else {
    return transcriptPanel.textContent.trim();
  }
}

function saveTranscript(transcriptData) {
  console.log("Full transcript captured");

  navigator.clipboard
    .writeText(transcriptData.text)
    .then(() => {
      console.log("Transcript copied to clipboard!");
      showNotification("Transcript copied to clipboard!");
    })
    .catch((err) => {
      console.error("Could not copy transcript: ", err);
    });
}

function showNotification(message) {
  const existingNotification = document.getElementById(
    "yt-transcript-notification"
  );
  if (existingNotification) {
    document.body.removeChild(existingNotification);
  }

  const notification = document.createElement("div");
  notification.id = "yt-transcript-notification";
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

  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.5s";

      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 500);
    }
  }, 3000);
}

const handleMessage = throttle((request, sender, sendResponse) => {
  if (request.action === "checkTranscript") {
    const transcriptButton =
      elementCache.transcriptButton ||
      document.querySelector(
        'button[aria-label*="transcript"], .ytp-transcript-button'
      );

    if (transcriptButton) {
      sendResponse({ transcriptAvailable: true });
    } else {
      sendResponse({ transcriptAvailable: false });
    }
  } else if (request.action === "ping") {
    sendResponse({ status: "active" });
  }
}, 300);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  observeTranscriptButton();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    observeTranscriptButton();
  });
}

const handleYouTubeNavigation = throttle(() => {
  if (window.location.pathname.includes("/watch")) {
    console.log("YouTube video page detected, initializing transcript capture");
    elementCache.transcriptButton = null;
    elementCache.transcriptPanel = null;
    window.captureRetries = 0;
    observeTranscriptButton();
  }
}, 500);

window.addEventListener("yt-navigate-finish", handleYouTubeNavigation);
