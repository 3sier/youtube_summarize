console.log("=== YOUTUBE TRANSCRIPT EXTRACTOR CONTENT SCRIPT LOADED ===");

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

let cachedElements = {
  transcriptPanel: null,
  languageSelector: null,
  menuButton: null,
  moreActionsButton: null,
  transcriptItems: null,
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

    if (isMobileYouTube()) {
      console.log("Detected mobile YouTube interface");
      return await getMobileTranscript();
    }

    if (cachedElements.transcriptPanel) {
      console.log("Using cached transcript panel");
      return extractTranscriptFromPanel(cachedElements.transcriptPanel);
    }

    const transcriptPanelSelectors = [
      "ytd-transcript-search-panel-renderer",
      "ytd-transcript-renderer",
      ".ytd-transcript-renderer",
      "#transcript-scrollbox",
      "ytd-transcript-body-renderer",
    ];

    for (const selector of transcriptPanelSelectors) {
      const panel = document.querySelector(selector);
      if (panel) {
        cachedElements.transcriptPanel = panel;
        console.log(`Found transcript panel with selector: ${selector}`);
        return extractTranscriptFromPanel(panel);
      }
    }

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

        for (const panelSelector of transcriptPanelSelectors) {
          const panel = document.querySelector(panelSelector);
          if (panel) {
            cachedElements.transcriptPanel = panel;
            return extractTranscriptFromPanel(panel);
          }
        }
      }
    }

    try {
      console.log("Trying method 1: Three dots menu");

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

    throw new Error("Could not find or open the complete transcript");
  } catch (error) {
    console.error("Failed to get transcript:", error);
    throw error;
  }
}

async function getMobileTranscript() {
  console.log("Attempting to extract transcript from mobile interface");

  try {
    try {
      console.log("Trying to find captions button on mobile");
      const captionsButtons = document.querySelectorAll("button");
      const captionsButton = Array.from(captionsButtons).find(
        (btn) =>
          btn.getAttribute("aria-label") &&
          (btn.getAttribute("aria-label").includes("caption") ||
            btn.getAttribute("aria-label").includes("subtitle"))
      );

      if (captionsButton) {
        console.log("Found captions button, checking if enabled");
        const isEnabled =
          captionsButton.getAttribute("aria-pressed") === "true" ||
          captionsButton.classList.contains("active");

        if (!isEnabled) {
          console.log("Enabling captions");
          captionsButton.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        return await collectMobileCaptionsOverTime();
      } else {
        throw new Error("Captions button not found on mobile interface");
      }
    } catch (error) {
      console.log("Mobile caption method failed:", error);

      try {
        console.log("Trying to find transcript panel on mobile");

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

            await selectMobileOriginalLanguage();

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

    const languageButtons = document.querySelectorAll(
      'button, [role="button"], .dropdown-trigger, [aria-label*="language" i], [aria-label*="language" i]'
    );

    const languageButton = Array.from(languageButtons).find(
      (btn) =>
        btn.textContent &&
        (btn.textContent.toLowerCase().includes("language") ||
          btn.textContent.toLowerCase().includes("language") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("language") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("language"))
    );

    if (!languageButton) {
      console.log("No language selector found on mobile");
      return;
    }

    const currentLanguage =
      languageButton.textContent?.trim() ||
      languageButton.getAttribute("aria-label") ||
      "Unknown";

    console.log("Current mobile language appears to be: " + currentLanguage);

    const isEnglish =
      currentLanguage.toLowerCase().includes("english") ||
      currentLanguage.toLowerCase().includes("english");

    if (!isEnglish) {
      console.log(
        "Non-English language already selected on mobile, keeping it"
      );
      return;
    }

    console.log("Opening language options on mobile");
    languageButton.click();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const options = document.querySelectorAll(
      '.menu-item, [role="menuitem"], li, .ytp-panel-menu-item'
    );
    if (!options || options.length === 0) {
      console.log("No language options found on mobile");
      document.body.click();
      return;
    }

    console.log(`Found ${options.length} language options on mobile`);

    const originalKeywords = [
      "original",
      "auto",
      "automatic",
      "automatic",
      "generated",
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

    let selectedOption = null;

    for (const option of options) {
      const text = option.textContent?.toLowerCase() || "";
      if (originalKeywords.some((keyword) => text.includes(keyword))) {
        selectedOption = option;
        console.log("Found original language option on mobile: " + text);
        break;
      }
    }

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

    if (!selectedOption && options.length > 0) {
      const firstOptionText = options[0].textContent?.toLowerCase() || "";
      if (
        !firstOptionText.includes("english") &&
        !firstOptionText.includes("english")
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
      document.body.click();
    } catch (e) {}
  }
}

async function collectMobileCaptionsOverTime() {
  console.log("Starting mobile caption collection...");
  let captions = [];
  let lastCaptionText = "";
  let duplicateCount = 0;
  let captionElements = null;

  return new Promise((resolve, reject) => {
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
    }, 30000);

    const interval = setInterval(() => {
      try {
        if (!captionElements) {
          const selectors = [
            ".caption-window",
            ".captions-text",
            ".ytp-caption-segment",
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements && elements.length > 0) {
              captionElements = elements;
              break;
            }
          }
        }

        if (!captionElements) return;

        let captionText = "";
        captionElements.forEach((el) => {
          captionText += el.textContent.trim() + " ";
        });

        captionText = captionText.trim();

        if (captionText && captionText !== lastCaptionText) {
          captions.push(captionText);
          lastCaptionText = captionText;
          duplicateCount = 0;
        } else {
          duplicateCount++;
        }

        if (duplicateCount > 5 && captions.length > 5) {
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
    }, 1000);
  });
}

async function extractTranscriptAfterOpen() {
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

  if (cachedElements.transcriptItems) {
    console.log("Using cached transcript items");
    const textArray = Array.from(cachedElements.transcriptItems).map(
      (segment) => segment.textContent.trim()
    );
    return textArray.join(" ");
  }

  const selectors = [
    "ytd-transcript-segment-renderer",
    "ytd-transcript-body-renderer",
    ".segment-text",
    ".ytd-transcript-segment-renderer",
  ];

  for (const selector of selectors) {
    const elements = panel.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      console.log(
        `Found ${elements.length} transcript segments using selector: ${selector}`
      );
      cachedElements.transcriptItems = elements;

      const textArray = Array.from(elements).map((segment) =>
        segment.textContent.trim()
      );
      const transcript = textArray.join(" ");

      console.log(
        `Extracted transcript with ${elements.length} segments and ${transcript.length} characters`
      );
      return transcript.trim();
    }
  }

  throw new Error("No transcript segments found in panel");
}

async function collectCaptionsOverTime() {
  console.log("Starting caption collection...");
  let captions = [];
  let lastCaptionText = "";
  let duplicateCount = 0;
  let lastCollectionTime = Date.now();
  const COLLECTION_INTERVAL = 2000;
  const MAX_DUPLICATES = 3;

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
    }, 15000);

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

          if (duplicateCount >= MAX_DUPLICATES && captions.length > 3) {
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
  const MAX_TRANSCRIPT_LENGTH = 12000;
  let trimmedTranscript = transcript;

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    console.log(
      `Transcript too long (${transcript.length} chars), trimming to ${MAX_TRANSCRIPT_LENGTH}`
    );
    const firstPart = transcript.substring(0, 4000);
    const middleStart = Math.floor((transcript.length - 4000) / 2);
    const middlePart = transcript.substring(middleStart, middleStart + 4000);
    const lastPart = transcript.substring(transcript.length - 4000);

    trimmedTranscript = `${firstPart}\n\n[...]\n\n${middlePart}\n\n[...]\n\n${lastPart}`;
  }

  try {
    if (!trimmedTranscript || trimmedTranscript.length < 10) {
      throw new Error("Transcript is too short or empty");
    }

    console.log("=== STARTING OPENAI API CALL ===");
    console.log("Transcript length:", trimmedTranscript.length);
    console.log(
      "API Key (first 5 characters):",
      apiKey.substring(0, 5) + "..."
    );
    console.log("Summary language:", summaryLanguage);

    let systemMessage = "";
    let userMessage = "";

    if (summaryLanguage === "auto") {
      const sampleText = trimmedTranscript.substring(0, 200);

      systemMessage =
        "You are a helpful assistant that creates concise summaries of video transcripts. " +
        "You will detect the language of the transcript and create the summary in the SAME language as the original transcript.";

      userMessage =
        `Please provide a concise summary of this video transcript. ` +
        `IMPORTANT: Detect the language of the transcript and create the summary in the SAME language as the original transcript. ` +
        `Do NOT translate to English unless the original transcript is already in English.\n\n${trimmedTranscript}`;

      console.log(
        "Auto language detection enabled. Will summarize in the original transcript language."
      );
    } else {
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
      userMessage = `Please provide a concise summary of this video transcript in ${languageName}:\n\n${trimmedTranscript}`;
      console.log(`Setting summary language to ${languageName}`);
    }

    const requestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        {
          role: "user",
          content: `${userMessage.substring(0, 100)}... (${
            trimmedTranscript.length
          } caracteres)`,
        },
      ],
      max_tokens: 500,
    };

    console.log(
      "Request body:",
      JSON.stringify(requestBody).substring(0, 500) + "..."
    );

    console.log("Making fetch to OpenAI API...");
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

    console.log("Response received, status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("OpenAI API error:", errorData);
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
    console.log("Summary generated successfully, length:", summary.length);
    console.log("=== END OF OPENAI API CALL ===");

    return summary;
  } catch (error) {
    console.error("SUMMARIZATION ERROR:", error);
    console.error("Complete message:", error.message);
    console.error("Stack trace:", error.stack);
    throw new Error("Failed to summarize transcript: " + error.message);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request.action);

  if (request.action === "transcribe") {
    handleTranscription(request.apiKey, request.summaryLanguage)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("Transcription error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "extract_and_summarize") {
    handleTranscription(request.apiKey, request.summaryLanguage)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("Extraction error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

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
        "Collecting real-time captions. Please let the video play to get more captions."
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
        summaryLanguage === "auto"
          ? " (in original language)"
          : summaryLanguage !== "auto"
          ? ` (${languageLabel})`
          : ""
      }:</h4>
      <p style="font-size: 24px; margin-bottom: 20px; line-height: 1.8; color: inherit;">${summary}</p>
      ${
        isPartial
          ? '<p style="color: #ffa366; font-size: 18px;">Note: This summary is based on a partial transcript. For better results, try using the "Show transcript" option in the video.</p>'
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

async function getFullTranscript() {
  try {
    console.log("Attempting to get FULL transcript...");

    try {
      const transcriptPanel = document.querySelector(
        "ytd-transcript-search-panel-renderer"
      );
      if (transcriptPanel) {
        console.log("Transcript panel already open");
        return extractTranscriptFromPanel(transcriptPanel);
      }

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

          const transcriptPanel = document.querySelector(
            "ytd-transcript-search-panel-renderer"
          );
          if (transcriptPanel) {
            return extractTranscriptFromPanel(transcriptPanel);
          }
        }
      }

      const videoId = getVideoId();
      if (!videoId) {
        throw new Error("No video ID found");
      }

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

          return await extractTranscriptAfterOpen();
        }
      }

      throw new Error("Could not find or open the complete transcript");
    } catch (error) {
      throw new Error(`Failed to get full transcript: ${error.message}`);
    }
  } catch (error) {
    console.error("Failed to get full transcript:", error);
    throw error;
  }
}

async function selectOriginalLanguage(panel) {
  try {
    console.log("Attempting to select original language for transcript...");

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

    if (!languageSelector) {
      console.log(
        "No language selector found, assuming original language is already selected"
      );
      return;
    }

    const selectedLanguage =
      languageSelector.textContent?.trim() ||
      languageSelector.innerText?.trim() ||
      languageSelector.getAttribute("aria-label") ||
      "Unknown";

    console.log(`Current selected language appears to be: ${selectedLanguage}`);

    const isEnglish =
      selectedLanguage.toLowerCase().includes("english") ||
      selectedLanguage.toLowerCase().includes("english") ||
      selectedLanguage.toLowerCase() === "english";

    if (isEnglish) {
      console.log(
        "English detected as current language, will try to select original language"
      );
    } else {
      console.log(
        "Non-English language already selected, likely the original language"
      );
      return;
    }

    try {
      console.log("Attempting to check available languages...");
      languageSelector.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
        const languages = languageOptions.map(
          (option) => option.textContent?.trim() || "Unknown"
        );
        console.log("Available languages:", languages);

        const originalLanguageKeywords = [
          "original",
          "auto-generated",
          "auto generated",
          "automatic",
          "automatic",
          "automatic",
          "automatically generated",
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

        if (!originalOption && languageOptions.length > 0) {
          const firstOptionText =
            languageOptions[0].textContent?.toLowerCase() || "";
          if (
            !firstOptionText.includes("english") &&
            !firstOptionText.includes("english")
          ) {
            originalOption = languageOptions[0];
            console.log(`Using first non-English option: ${firstOptionText}`);
          }
        }

        if (originalOption) {
          console.log("Selecting original/non-English language option");
          originalOption.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return;
        } else {
          console.log(
            "No clear original/non-English language found, closing dropdown"
          );
          document.body.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        console.log(
          "No language options found, likely only one language available"
        );
        document.body.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.warn("Error checking language options:", error);
      document.body.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.warn("Error in selectOriginalLanguage:", error);
  }
}

function showUserNotice(message) {
  removeUserNotice();

  const noticeDiv = document.createElement("div");
  noticeDiv.id = "transcript-collector-notice";

  noticeDiv.className = "transcript-notice";
  noticeDiv.textContent = message;

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

  setTimeout(removeUserNotice, 15000);
}

function removeUserNotice() {
  const notice = document.getElementById("transcript-collector-notice");
  if (notice) {
    notice.remove();
  }
}
