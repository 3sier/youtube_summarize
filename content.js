console.log("=== YOUTUBE TRANSCRIPT EXTRACTOR CONTENT SCRIPT LOADED ===");

let cachedElements = {
  transcriptPanel: null,
  languageSelector: null,
  menuButton: null,
  moreActionsButton: null,
};

function isMobileYouTube() {
  return window.location.hostname.includes("m.youtube.com");
}

function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
}

function getVideoTitle() {
  const selectors = [
    "h1.ytd-video-primary-info-renderer",
    "h1.title.style-scope.ytd-video-primary-info-renderer",
    "#container h1",
    ".ytp-title-link",
    ".slim-video-information-title",
    ".player-overlays .title",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }

  return "YouTube Video";
}

async function getTranscript() {
  try {
    console.log("Attempting to get transcript with improved detection...");

    // Check if we're on mobile YouTube
    if (isMobileYouTube()) {
      console.log("Detected mobile YouTube interface");
      return await getMobileTranscript();
    }

    // Try to find the transcript panel directly
    const transcriptPanelSelectors = [
      "ytd-transcript-search-panel-renderer",
      "ytd-transcript-renderer",
      ".ytd-transcript-renderer",
      "#transcript-scrollbox",
      "ytd-transcript-body-renderer",
    ];

    // Cache the transcript panel if found
    if (!cachedElements.transcriptPanel) {
      for (const selector of transcriptPanelSelectors) {
        const panel = document.querySelector(selector);
        if (panel) {
          cachedElements.transcriptPanel = panel;
          console.log(`Found transcript panel with selector: ${selector}`);
          break;
        }
      }
    }

    if (cachedElements.transcriptPanel) {
      return extractTranscriptFromPanel(cachedElements.transcriptPanel);
    }

    // Try to find transcript button
    const transcriptButtonSelectors = [
      '[aria-label="Open transcript"]',
      'button[aria-label*="transcript" i]',
      'button[aria-label*="Transcript" i]',
    ];

    for (const selector of transcriptButtonSelectors) {
      const button = document.querySelector(selector);
      if (button) {
        console.log(
          `Found direct transcript button with selector: ${selector}`
        );
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Look for the panel again
        for (const panelSelector of transcriptPanelSelectors) {
          const panel = document.querySelector(panelSelector);
          if (panel) {
            cachedElements.transcriptPanel = panel;
            return extractTranscriptFromPanel(panel);
          }
        }
      }
    }

    // Method 1: Try to find transcript button in three dots menu
    try {
      console.log("Trying method 1: Three dots menu");

      // Cache the menu button if not already cached
      if (!cachedElements.menuButton) {
        cachedElements.menuButton = document.querySelector(
          'button.ytp-button[aria-label="More actions"]'
        );
      }

      if (cachedElements.menuButton) {
        console.log("Clicking menu button");
        cachedElements.menuButton.click();
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const menuItems = document.querySelectorAll("tp-yt-paper-item");
        console.log(`Found ${menuItems.length} menu items`);

        const transcriptButton = Array.from(menuItems).find(
          (item) =>
            item &&
            item.textContent &&
            item.textContent.includes("Show transcript")
        );

        if (transcriptButton) {
          console.log("Clicking transcript button");
          transcriptButton.click();
          await new Promise((resolve) => setTimeout(resolve, 2500));

          return await extractTranscriptAfterOpen();
        }
      }
    } catch (error) {
      console.log("First method failed:", error.message);
    }

    throw new Error("No se pudo encontrar o abrir la transcripción completa");
  } catch (error) {
    console.error("Failed to get transcript:", error);
    throw error;
  }
}

async function getMobileTranscript() {
  console.log("Attempting to extract transcript from mobile interface");

  try {
    // Method 1: Try to enable captions and collect them
    try {
      console.log("Trying to find captions button on mobile");
      // Look for the captions button on mobile
      const captionsButtons = document.querySelectorAll("button");
      const captionsButton = Array.from(captionsButtons).find(
        (btn) =>
          btn.getAttribute("aria-label") &&
          (btn.getAttribute("aria-label").includes("caption") ||
            btn.getAttribute("aria-label").includes("subtitle"))
      );

      if (captionsButton) {
        console.log("Found captions button, checking if enabled");
        // Check if captions are already enabled
        const isEnabled =
          captionsButton.getAttribute("aria-pressed") === "true" ||
          captionsButton.classList.contains("active");

        if (!isEnabled) {
          console.log("Enabling captions");
          captionsButton.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Try to collect captions
        return await collectMobileCaptionsOverTime();
      } else {
        throw new Error("Captions button not found on mobile interface");
      }
    } catch (error) {
      console.log("Mobile caption method failed:", error);

      // Method 2: Try to find and open transcript panel on mobile
      try {
        console.log("Trying to find transcript panel on mobile");

        // Look for the more options button
        const moreButtons = document.querySelectorAll("button");
        const moreButton = Array.from(moreButtons).find(
          (btn) =>
            btn.getAttribute("aria-label") &&
            btn.getAttribute("aria-label").includes("More")
        );

        if (moreButton) {
          console.log("Found more options button, clicking");
          moreButton.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Look for transcript option
          const menuItems = document.querySelectorAll(
            'a, button, div[role="button"]'
          );
          const transcriptItem = Array.from(menuItems).find(
            (item) =>
              item.textContent &&
              (item.textContent.includes("transcript") ||
                item.textContent.includes("Transcript"))
          );

          if (transcriptItem) {
            console.log("Found transcript option, clicking");
            transcriptItem.click();
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Check for language selector on mobile - IMPROVED VERSION
            await selectMobileOriginalLanguage();

            // Try to extract transcript
            const transcriptItems = document.querySelectorAll(
              ".transcript-item, .caption-line"
            );
            if (transcriptItems && transcriptItems.length > 0) {
              console.log(`Found ${transcriptItems.length} transcript items`);
              let transcript = "";
              transcriptItems.forEach((item) => {
                transcript += item.textContent.trim() + " ";
              });
              return transcript.trim();
            } else {
              throw new Error("No transcript items found on mobile");
            }
          } else {
            throw new Error("Transcript option not found in mobile menu");
          }
        } else {
          throw new Error("More options button not found on mobile");
        }
      } catch (method2Error) {
        console.log("Mobile transcript panel method failed:", method2Error);

        // Method 3: Last resort - try to capture video content directly
        try {
          console.log("Trying to find captions on player directly");
          const captionElements = document.querySelectorAll(
            ".captions-text, .ytp-caption-segment"
          );

          if (captionElements && captionElements.length > 0) {
            return await collectMobileCaptionsOverTime();
          } else {
            throw new Error("No caption elements found on mobile player");
          }
        } catch (method3Error) {
          console.log("All mobile methods failed:", method3Error);
          throw new Error(
            "Could not extract transcript from mobile YouTube. Try using desktop version."
          );
        }
      }
    }
  } catch (error) {
    console.error("Mobile transcript extraction failed:", error);
    throw new Error(
      "Failed to get transcript from mobile YouTube: " + error.message
    );
  }
}

async function selectMobileOriginalLanguage() {
  try {
    console.log("Attempting to select original language on mobile");

    // Find language selector buttons
    const languageButtons = document.querySelectorAll(
      'button, [role="button"], .dropdown-trigger, [aria-label*="language" i], [aria-label*="idioma" i]'
    );

    const languageButton = Array.from(languageButtons).find(
      (btn) =>
        btn.textContent &&
        (btn.textContent.toLowerCase().includes("language") ||
          btn.textContent.toLowerCase().includes("idioma") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("language") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("idioma"))
    );

    if (!languageButton) {
      console.log("No language selector found on mobile");
      return;
    }

    // Get current selected language
    const currentLanguage =
      languageButton.textContent?.trim() ||
      languageButton.getAttribute("aria-label") ||
      "Unknown";

    console.log("Current mobile language appears to be: " + currentLanguage);

    // Skip if already not English
    const isEnglish =
      currentLanguage.toLowerCase().includes("english") ||
      currentLanguage.toLowerCase().includes("inglés");

    if (!isEnglish) {
      console.log(
        "Non-English language already selected on mobile, keeping it"
      );
      return;
    }

    // Click to open language options
    console.log("Opening language options on mobile");
    languageButton.click();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Look for options
    const options = document.querySelectorAll(
      '.menu-item, [role="menuitem"], li, .ytp-panel-menu-item'
    );
    if (!options || options.length === 0) {
      console.log("No language options found on mobile");
      document.body.click(); // Close menu
      return;
    }

    console.log(`Found ${options.length} language options on mobile`);

    // Define keywords to look for
    const originalKeywords = [
      "original",
      "auto",
      "automatic",
      "automático",
      "generado",
    ];
    const nonEnglishKeywords = [
      "español",
      "spanish",
      "français",
      "french",
      "deutsch",
      "german",
      "italiano",
      "italian",
      "português",
      "portuguese",
      "русский",
      "russian",
      "日本語",
      "japanese",
      "한국어",
      "korean",
      "中文",
      "chinese",
    ];

    // Try to find original language first
    let selectedOption = null;

    for (const option of options) {
      const text = option.textContent?.toLowerCase() || "";
      if (originalKeywords.some((keyword) => text.includes(keyword))) {
        selectedOption = option;
        console.log("Found original language option on mobile: " + text);
        break;
      }
    }

    // If no original language found, try non-English language
    if (!selectedOption) {
      for (const option of options) {
        const text = option.textContent?.toLowerCase() || "";
        if (nonEnglishKeywords.some((keyword) => text.includes(keyword))) {
          selectedOption = option;
          console.log("Found non-English language option on mobile: " + text);
          break;
        }
      }
    }

    // Select found option or use first non-English option as last resort
    if (!selectedOption && options.length > 0) {
      const firstOptionText = options[0].textContent?.toLowerCase() || "";
      if (
        !firstOptionText.includes("english") &&
        !firstOptionText.includes("inglés")
      ) {
        selectedOption = options[0];
        console.log(
          "Using first non-English option on mobile: " + firstOptionText
        );
      }
    }

    if (selectedOption) {
      console.log("Selecting language option on mobile");
      selectedOption.click();
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      console.log("No suitable language option found on mobile, closing menu");
      document.body.click();
    }
  } catch (error) {
    console.warn("Error selecting language on mobile:", error);
    try {
      // Try to close any open menu
      document.body.click();
    } catch (e) {
      // Ignore
    }
  }
}

async function collectMobileCaptionsOverTime() {
  console.log("Starting mobile caption collection...");
  let captions = [];
  let lastCaptionText = "";
  let duplicateCount = 0;

  // Create caption collection interval
  return new Promise((resolve, reject) => {
    // Set timeout to stop collection after 45 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);

      if (captions.length > 0) {
        console.log(
          `Mobile caption collection complete. Collected ${captions.length} captions.`
        );
        resolve(captions.join(" "));
      } else {
        reject(new Error("No captions could be collected from mobile player"));
      }
    }, 45000);

    // Collect captions every 500ms
    const interval = setInterval(() => {
      try {
        // Try multiple selector types for mobile captions
        const selectors = [
          ".caption-window",
          ".captions-text",
          ".ytp-caption-segment",
        ];
        let captionText = "";

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements && elements.length > 0) {
            elements.forEach((el) => {
              captionText += el.textContent.trim() + " ";
            });
            break;
          }
        }

        captionText = captionText.trim();

        if (captionText && captionText !== lastCaptionText) {
          captions.push(captionText);
          lastCaptionText = captionText;
          duplicateCount = 0;
        } else {
          duplicateCount++;
        }

        // If we see the same caption for 10 checks and have collected some captions,
        // assume the video is paused or ended
        if (duplicateCount > 10 && captions.length > 5) {
          clearInterval(interval);
          clearTimeout(timeout);
          console.log(
            `Mobile caption collection complete. Collected ${captions.length} captions.`
          );
          resolve(captions.join(" "));
        }
      } catch (error) {
        console.error("Error collecting mobile captions:", error);
      }
    }, 500);
  });
}

async function extractTranscriptAfterOpen() {
  // Try multiple selectors for transcript segments
  const selectors = [
    "ytd-transcript-segment-renderer",
    "ytd-transcript-segment-list-renderer",
    ".ytd-transcript-segment-list-renderer",
  ];

  let segments = [];

  for (const selector of selectors) {
    segments = document.querySelectorAll(selector);
    if (segments && segments.length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`Found ${segments.length} transcript segments`);

  if (!segments || segments.length === 0) {
    throw new Error("No transcript segments found");
  }

  let transcript = "";
  segments.forEach((segment) => {
    transcript += segment.textContent.trim() + " ";
  });

  return transcript.trim();
}

function extractTranscriptFromPanel(panel) {
  console.log("Extracting transcript from panel...");

  // Cache DOM queries
  const selectors = [
    "ytd-transcript-segment-renderer",
    "ytd-transcript-body-renderer",
    ".segment-text",
    ".ytd-transcript-segment-renderer",
  ];

  let segments = null;
  let transcript = "";

  // Use a single loop to find segments
  for (const selector of selectors) {
    const elements = panel.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      console.log(
        `Found ${elements.length} transcript segments using selector: ${selector}`
      );
      segments = elements;
      break;
    }
  }

  if (!segments || segments.length === 0) {
    throw new Error("No transcript segments found in panel");
  }

  // Use a more efficient way to concatenate text
  const textArray = Array.from(segments).map((segment) =>
    segment.textContent.trim()
  );
  transcript = textArray.join(" ");

  console.log(
    `Extracted full transcript with ${segments.length} segments and ${transcript.length} characters`
  );
  return transcript.trim();
}

async function collectCaptionsOverTime() {
  console.log("Starting caption collection...");
  let captions = [];
  let lastCaptionText = "";
  let duplicateCount = 0;
  let lastCollectionTime = Date.now();
  const COLLECTION_INTERVAL = 1000;
  const MAX_DUPLICATES = 5;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(interval);

      if (captions.length > 0) {
        console.log(
          `Caption collection complete. Collected ${captions.length} captions.`
        );
        resolve(captions.join(" "));
      } else {
        reject(new Error("No captions could be collected"));
      }
    }, 20000);

    const interval = setInterval(() => {
      try {
        const currentTime = Date.now();
        if (currentTime - lastCollectionTime < COLLECTION_INTERVAL) {
          return;
        }
        lastCollectionTime = currentTime;

        const captionWindow = document.querySelector(".caption-window");
        if (captionWindow) {
          const captionText = captionWindow.textContent.trim();

          if (captionText && captionText !== lastCaptionText) {
            captions.push(captionText);
            lastCaptionText = captionText;
            duplicateCount = 0;
          } else {
            duplicateCount++;
          }

          if (duplicateCount > MAX_DUPLICATES && captions.length > 5) {
            clearInterval(interval);
            clearTimeout(timeout);
            console.log(
              `Caption collection complete. Collected ${captions.length} captions.`
            );
            resolve(captions.join(" "));
          }
        }
      } catch (error) {
        console.error("Error collecting captions:", error);
      }
    }, COLLECTION_INTERVAL);
  });
}

async function summarizeTranscript(
  transcript,
  apiKey,
  summaryLanguage = "auto"
) {
  try {
    if (!transcript || transcript.length < 10) {
      throw new Error("Transcript is too short or empty");
    }

    console.log("=== INICIANDO LLAMADA A OPENAI API ===");
    console.log("Longitud del transcript:", transcript.length);
    console.log(
      "API Key (primeros 5 caracteres):",
      apiKey.substring(0, 5) + "..."
    );
    console.log("Summary language:", summaryLanguage);

    let systemMessage =
      "You are a helpful assistant that creates concise summaries of video transcripts.";
    let userMessage = `Please provide a concise summary of this video transcript:\n\n${transcript}`;

    if (summaryLanguage && summaryLanguage !== "auto") {
      let languageName = "";

      switch (summaryLanguage) {
        case "en":
          languageName = "English";
          break;
        case "es":
          languageName = "Spanish";
          break;
        case "fr":
          languageName = "French";
          break;
        case "de":
          languageName = "German";
          break;
        case "it":
          languageName = "Italian";
          break;
        case "pt":
          languageName = "Portuguese";
          break;
        case "ru":
          languageName = "Russian";
          break;
        case "ja":
          languageName = "Japanese";
          break;
        case "ko":
          languageName = "Korean";
          break;
        case "zh":
          languageName = "Chinese";
          break;
        default:
          languageName = "English";
      }

      systemMessage = `You are a helpful assistant that creates concise summaries of video transcripts in ${languageName}.`;
      userMessage = `Please provide a concise summary of this video transcript in ${languageName}:\n\n${transcript}`;
      console.log(`Setting summary language to ${languageName}`);
    }

    const requestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        {
          role: "user",
          content: `${userMessage.substring(0, 100)}... (${
            transcript.length
          } caracteres)`,
        },
      ],
      max_tokens: 500,
    };

    console.log(
      "Request body:",
      JSON.stringify(requestBody).substring(0, 500) + "..."
    );

    console.log("Realizando fetch a OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
      }),
    });

    console.log("Respuesta recibida, status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Error de la API de OpenAI:", errorData);
      throw new Error(
        `OpenAI API error (${response.status}): ${
          errorData ? JSON.stringify(errorData) : "Unknown error"
        }`
      );
    }

    const data = await response.json();
    console.log(
      "Datos de respuesta recibidos:",
      JSON.stringify(data).substring(0, 500) + "..."
    );

    const summary = data.choices[0].message.content;
    console.log("Resumen generado correctamente, longitud:", summary.length);
    console.log("=== FIN DE LLAMADA A OPENAI API ===");

    return summary;
  } catch (error) {
    console.error("ERROR DE SUMMARIZACIÓN:", error);
    console.error("Mensaje completo:", error.message);
    console.error("Stack trace:", error.stack);
    throw new Error("Failed to summarize transcript: " + error.message);
  }
}

// Listen for messages from popup and respond to let popup know we're ready
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request.action);

  if (request.action === "transcribe") {
    handleTranscription(request.apiKey, request.summaryLanguage)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("Transcription error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }

  if (request.action === "extract_and_summarize") {
    handleTranscription(request.apiKey, request.summaryLanguage)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("Extraction error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Main transcription handler
async function handleTranscription(apiKey, summaryLanguage = "auto") {
  try {
    console.log("Starting transcription process...");
    console.log("Using summary language:", summaryLanguage);
    const videoId = getVideoId();
    if (!videoId) {
      throw new Error("No video ID found in URL");
    }

    const videoTitle = getVideoTitle();
    console.log("Getting transcript...");

    let transcript;
    let isPartial = false;

    try {
      transcript = await getFullTranscript();
      console.log("Full transcript obtained successfully!");
    } catch (fullTranscriptError) {
      console.warn(
        "Could not get full transcript:",
        fullTranscriptError.message
      );
      console.log("Falling back to collecting captions over time...");

      showUserNotice(
        "Recopilando subtítulos en tiempo real. Por favor, deja que el video se reproduzca para obtener más subtítulos."
      );

      transcript = await getTranscript();
      isPartial = true;
    }

    console.log("Transcript obtained, length:", transcript.length);

    console.log("Getting summary...");
    const summary = await summarizeTranscript(
      transcript,
      apiKey,
      summaryLanguage
    );

    let languageLabel = "original language";
    if (summaryLanguage && summaryLanguage !== "auto") {
      switch (summaryLanguage) {
        case "en":
          languageLabel = "English";
          break;
        case "es":
          languageLabel = "Spanish";
          break;
        case "fr":
          languageLabel = "French";
          break;
        case "de":
          languageLabel = "German";
          break;
        case "it":
          languageLabel = "Italian";
          break;
        case "pt":
          languageLabel = "Portuguese";
          break;
        case "ru":
          languageLabel = "Russian";
          break;
        case "ja":
          languageLabel = "Japanese";
          break;
        case "ko":
          languageLabel = "Korean";
          break;
        case "zh":
          languageLabel = "Chinese";
          break;
        default:
          languageLabel = summaryLanguage;
      }
    }

    const resultsDiv = document.createElement("div");

    const isDarkTheme =
      document.documentElement.classList.contains("dark-theme") ||
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark-theme") ||
      document.body.style.backgroundColor === "rgb(0, 0, 0)" ||
      document.body.style.backgroundColor === "#000000" ||
      window.getComputedStyle(document.body).backgroundColor ===
        "rgb(0, 0, 0)" ||
      window.getComputedStyle(document.body).backgroundColor === "#000000";

    console.log("Dark theme detected:", isDarkTheme);

    resultsDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 600px;
      max-height: 80vh;
      background: ${isDarkTheme ? "#1a1a1a" : "white"};
      color: ${isDarkTheme ? "#ffffff" : "#000000"};
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,${isDarkTheme ? "0.3" : "0.1"});
      z-index: 9999;
      overflow-y: auto;
      font-size: 24px;
      line-height: 1.8;
    `;

    resultsDiv.innerHTML = `
      <h3 style="font-size: 28px; margin-bottom: 20px; color: inherit;">${videoTitle}</h3>
      <h4 style="font-size: 26px; margin-bottom: 20px; color: inherit;">Summary${
        summaryLanguage !== "auto" ? ` (${languageLabel})` : ""
      }:</h4>
      <p style="font-size: 24px; margin-bottom: 20px; line-height: 1.8; color: inherit;">${summary}</p>
      ${
        isPartial
          ? '<p style="color: #ffa366; font-size: 18px;">Nota: Este resumen se basa en una transcripción parcial. Para mejores resultados, intenta usar la opción "Mostrar transcripción" del video.</p>'
          : ""
      }
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        padding: 5px 10px;
        color: ${isDarkTheme ? "#ffffff" : "#666"};
        transition: color 0.2s ease;
      ">×</button>
    `;

    document.body.appendChild(resultsDiv);

    const style = document.createElement("style");
    style.textContent = `
      #youtube-transcript-summary {
        background: ${isDarkTheme ? "#1a1a1a" : "white"} !important;
        color: ${isDarkTheme ? "#ffffff" : "#000000"} !important;
      }
      #youtube-transcript-summary h3,
      #youtube-transcript-summary h4,
      #youtube-transcript-summary p {
        color: ${isDarkTheme ? "#ffffff" : "#000000"} !important;
      }
      #youtube-transcript-summary button {
        color: ${isDarkTheme ? "#ffffff" : "#666"} !important;
      }
      #youtube-transcript-summary button:hover {
        color: #ffa366 !important;
      }
    `;
    document.head.appendChild(style);

    resultsDiv.id = "youtube-transcript-summary";

    const closeButton = resultsDiv.querySelector("button");
    if (closeButton) {
      closeButton.addEventListener("mouseover", () => {
        closeButton.style.color = "#ffa366";
      });
      closeButton.addEventListener("mouseout", () => {
        closeButton.style.color = isDarkTheme ? "#ffffff" : "#666";
      });
    }

    console.log("Summary displayed successfully");

    if (isPartial) {
      removeUserNotice();
    }

    return { success: true, summary: summary };
  } catch (error) {
    console.error("Error in handleTranscription:", error);
    removeUserNotice();
    return { success: false, error: error.message };
  }
}

// Función para obtener la transcripción completa del video utilizando la API de YouTube
async function getFullTranscript() {
  try {
    console.log("Attempting to get FULL transcript...");

    // Primero, intentar obtener la transcripción a través del panel de transcripción
    try {
      // Método 1: Buscar directamente el panel de transcripción (si ya está abierto)
      const transcriptPanel = document.querySelector(
        "ytd-transcript-search-panel-renderer"
      );
      if (transcriptPanel) {
        console.log("Transcript panel already open");
        return extractTranscriptFromPanel(transcriptPanel);
      }

      // Método 2: Intentar abrir el menú de transcripción desde botón específico (en dispositivos más nuevos)
      const transcriptButton =
        document.querySelector('[aria-label="Open transcript"]') ||
        document.querySelector('button[aria-label*="transcript" i]');

      if (transcriptButton) {
        console.log("Found direct transcript button, clicking...");
        transcriptButton.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const transcriptPanel = document.querySelector(
          "ytd-transcript-search-panel-renderer"
        );
        if (transcriptPanel) {
          return extractTranscriptFromPanel(transcriptPanel);
        }
      }

      // Método 3: Intentar acceder por el botón de "..." en la descripción del video
      const moreActionsButtons = document.querySelectorAll(
        'button[aria-label="More actions"]'
      );
      let descriptionMoreButton = null;

      for (const btn of moreActionsButtons) {
        if (!btn.classList.contains("ytp-button")) {
          descriptionMoreButton = btn;
          break;
        }
      }

      if (descriptionMoreButton) {
        console.log("Found more button in description, clicking...");
        descriptionMoreButton.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Buscar opción de mostrar transcripción
        const menuItems = document.querySelectorAll(
          "ytd-menu-service-item-renderer"
        );
        const showTranscriptItem = Array.from(menuItems).find(
          (item) =>
            item && item.textContent && item.textContent.includes("transcript")
        );

        if (showTranscriptItem) {
          console.log("Found transcript option in menu, clicking...");
          showTranscriptItem.click();
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Obtener panel de transcripción
          const transcriptPanel = document.querySelector(
            "ytd-transcript-search-panel-renderer"
          );
          if (transcriptPanel) {
            return extractTranscriptFromPanel(transcriptPanel);
          }
        }
      }

      // Método 4: Último intento - usar la API de YouTube si es posible
      const videoId = getVideoId();
      if (!videoId) {
        throw new Error("No video ID found");
      }

      // Intentar acceder a la transcripción desde botón de puntos suspensivos del reproductor
      console.log("Trying through player more actions button...");
      const menuButton = document.querySelector(
        'button.ytp-button[aria-label="More actions"]'
      );
      if (menuButton) {
        menuButton.click();
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const menuItems = document.querySelectorAll("tp-yt-paper-item");
        const transcriptButton = Array.from(menuItems).find(
          (item) =>
            item &&
            item.textContent &&
            item.textContent.includes("Show transcript")
        );

        if (transcriptButton) {
          transcriptButton.click();
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Buscar contenedor de transcripción
          return await extractTranscriptAfterOpen();
        }
      }

      throw new Error("No se pudo encontrar o abrir la transcripción completa");
    } catch (error) {
      throw new Error(`Failed to get full transcript: ${error.message}`);
    }
  } catch (error) {
    console.error("Failed to get full transcript:", error);
    throw error;
  }
}

// Helper function to detect available transcript languages and select the original one
async function selectOriginalLanguage(panel) {
  try {
    console.log("Attempting to select original language for transcript...");

    // Common selectors for language dropdowns in YouTube
    const languageSelectors = [
      'paper-dropdown-menu[label*="language" i]',
      'paper-dropdown-menu[aria-label*="language" i]',
      'yt-dropdown-menu[label*="language" i]',
      'button[aria-label*="language" i]',
      '.dropdown-trigger[aria-label*="language" i]',
      'ytd-menu-renderer[aria-label*="language" i]',
      '[aria-label*="idioma" i]',
      '[aria-label*="language" i]',
    ];

    // Find language selector
    let languageSelector = null;
    for (const selector of languageSelectors) {
      const element =
        panel?.querySelector(selector) || document.querySelector(selector);
      if (element) {
        languageSelector = element;
        console.log(`Found language selector: ${selector}`);
        break;
      }
    }

    // If no language selector found, return (likely only one language available)
    if (!languageSelector) {
      console.log(
        "No language selector found, assuming original language is already selected"
      );
      return;
    }

    // Get currently selected language
    const selectedLanguage =
      languageSelector.textContent?.trim() ||
      languageSelector.innerText?.trim() ||
      languageSelector.getAttribute("aria-label") ||
      "Unknown";

    console.log(`Current selected language appears to be: ${selectedLanguage}`);

    // Check if "English" is in the selected language
    const isEnglish =
      selectedLanguage.toLowerCase().includes("english") ||
      selectedLanguage.toLowerCase().includes("inglés") ||
      selectedLanguage.toLowerCase() === "english";

    if (isEnglish) {
      console.log(
        "English detected as current language, will try to select original language"
      );
    } else {
      console.log(
        "Non-English language already selected, likely the original language"
      );
      // If already a non-English language, we can use that (likely original)
      return;
    }

    // Check if dropdown has multiple options
    // Try to click the dropdown to see the options
    try {
      console.log("Attempting to check available languages...");
      languageSelector.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Look for language options
      const optionSelectors = [
        "paper-item",
        "yt-dropdown-item",
        "ytd-menu-service-item-renderer",
        ".ytd-menu-popup-renderer",
        "tp-yt-paper-item",
        ".ytp-panel-menu-item",
      ];

      let languageOptions = [];
      for (const selector of optionSelectors) {
        const options = document.querySelectorAll(selector);
        if (options && options.length > 0) {
          console.log(
            `Found ${options.length} language options with selector: ${selector}`
          );
          languageOptions = Array.from(options);
          break;
        }
      }

      if (languageOptions.length > 0) {
        // Log available languages
        const languages = languageOptions.map(
          (option) => option.textContent?.trim() || "Unknown"
        );
        console.log("Available languages:", languages);

        // Look for cues that indicate the original language
        const originalLanguageKeywords = [
          "original",
          "auto-generated",
          "auto generated",
          "automatic",
          "automático",
          "automática",
          "generado automáticamente",
        ];

        // Look for non-English languages first
        const nonEnglishKeywords = [
          "español",
          "spanish",
          "français",
          "french",
          "deutsch",
          "german",
          "italiano",
          "italian",
          "português",
          "portuguese",
          "русский",
          "russian",
          "日本語",
          "japanese",
          "한국어",
          "korean",
          "中文",
          "chinese",
        ];

        // First priority: Find options with original language keywords
        let originalOption = null;
        for (const option of languageOptions) {
          const text = option.textContent?.toLowerCase() || "";
          if (
            originalLanguageKeywords.some((keyword) => text.includes(keyword))
          ) {
            originalOption = option;
            console.log(
              `Found likely original language option with keyword: ${text}`
            );
            break;
          }
        }

        // Second priority: Find non-English language options
        if (!originalOption) {
          for (const option of languageOptions) {
            const text = option.textContent?.toLowerCase() || "";
            if (nonEnglishKeywords.some((keyword) => text.includes(keyword))) {
              originalOption = option;
              console.log(`Found non-English language option: ${text}`);
              break;
            }
          }
        }

        // Third priority: If not English, use the first option
        if (!originalOption && languageOptions.length > 0) {
          const firstOptionText =
            languageOptions[0].textContent?.toLowerCase() || "";
          if (
            !firstOptionText.includes("english") &&
            !firstOptionText.includes("inglés")
          ) {
            originalOption = languageOptions[0];
            console.log(`Using first non-English option: ${firstOptionText}`);
          }
        }

        // If we found a suitable option, select it
        if (originalOption) {
          console.log("Selecting original/non-English language option");
          originalOption.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return;
        } else {
          // If all options are English or we couldn't identify a good option
          console.log(
            "No clear original/non-English language found, closing dropdown"
          );
          // Close the dropdown without changing selection (click outside)
          document.body.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        console.log(
          "No language options found, likely only one language available"
        );
        // Close dropdown
        document.body.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.warn("Error checking language options:", error);
      // Try to close any open dropdown by clicking outside
      document.body.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.warn("Error in selectOriginalLanguage:", error);
    // This is a helper function, so we'll just log the error and continue
  }
}

// Function to show notification to user
function showUserNotice(message) {
  // Remove any existing notice first
  removeUserNotice();

  const noticeDiv = document.createElement("div");
  noticeDiv.id = "transcript-collector-notice";

  // Use CSS classes instead of inline styles for better performance
  noticeDiv.className = "transcript-notice";
  noticeDiv.textContent = message;

  // Add styles to head instead of inline
  if (!document.getElementById("transcript-notice-style")) {
    const style = document.createElement("style");
    style.id = "transcript-notice-style";
    style.textContent = `
      .transcript-notice {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        max-width: 80%;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(noticeDiv);

  // Auto-hide after 15 seconds
  setTimeout(removeUserNotice, 15000);
}

// Function to remove user notice
function removeUserNotice() {
  const notice = document.getElementById("transcript-collector-notice");
  if (notice) {
    notice.remove();
  }
}
