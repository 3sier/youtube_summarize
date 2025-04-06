document.addEventListener("DOMContentLoaded", function () {
  console.log("=== POPUP INITIALIZED ===");

  const debounce = (func, delay) => {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function () {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function () {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  };

  const elements = {
    transcribeBtn: document.getElementById("transcribeBtn"),
    apiKeyInput: document.getElementById("apiKey"),
    statusDiv: document.getElementById("status"),
    checkPageButton: document.getElementById("checkPage"),
    saveButton: document.getElementById("saveApiKey"),
    extractButton: document.getElementById("extractButton"),
    copyButton: document.getElementById("copyButton"),
    summaryContainer: document.getElementById("summaryContainer"),
    languageSelect: document.getElementById("summaryLanguage"),
    themeToggle: document.getElementById("themeToggle"),
    apiKeyGroup: document.getElementById("apiKeyGroup"),
    apiKeySaved: document.getElementById("apiKeySaved"),
    changeApiKey: document.getElementById("changeApiKey"),
  };

  console.log(
    "Elements found:",
    Object.fromEntries(
      Object.entries(elements).map(([key, val]) => [key, !!val])
    )
  );

  chrome.storage.sync.get(
    ["openaiApiKey", "summaryLanguage", "theme"],
    function (result) {
      if (result.openaiApiKey) {
        console.log("API key found in storage");
        if (elements.apiKeyInput)
          elements.apiKeyInput.value = result.openaiApiKey;
      } else {
        console.log("No API key found in storage");
      }

      if (result.summaryLanguage && elements.languageSelect) {
        elements.languageSelect.value = result.summaryLanguage;
      }

      if (result.theme === "dark") {
        document.body.classList.add("dark-theme");
        if (elements.themeToggle) elements.themeToggle.textContent = "☀️";
      }

      updateApiKeyVisibility(!!result.apiKey);
    }
  );

  function updateApiKeyVisibility(hasKey) {
    if (elements.apiKeyGroup && elements.apiKeySaved) {
      elements.apiKeyGroup.style.display = hasKey ? "none" : "block";
      elements.apiKeySaved.style.display = hasKey ? "block" : "none";
    }
  }

  if (elements.apiKeyInput) {
    elements.apiKeyInput.addEventListener(
      "input",
      debounce(function () {
        console.log("Saving new API key to storage");
        chrome.storage.sync.set({
          openaiApiKey: elements.apiKeyInput.value,
        });
      }, 500)
    );
  }

  if (elements.saveButton) {
    elements.saveButton.addEventListener("click", function () {
      const apiKey = elements.apiKeyInput
        ? elements.apiKeyInput.value.trim()
        : "";
      const language = elements.languageSelect
        ? elements.languageSelect.value
        : "auto";

      chrome.storage.sync.set(
        {
          openai_api_key: apiKey,
          summaryLanguage: language,
        },
        function () {
          showStatus("Settings saved", "success");
          setTimeout(clearStatus, 1500);
        }
      );
    });
  }

  if (elements.languageSelect) {
    elements.languageSelect.addEventListener("change", function () {
      chrome.storage.sync.set({
        summaryLanguage: elements.languageSelect.value,
      });
    });
  }

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      elements.themeToggle.textContent = isDark ? "☀️" : "🌙";

      chrome.storage.sync.set({
        theme: isDark ? "dark" : "light",
      });
    });
  }

  async function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus("Please enter an API key", "error");
      return;
    }

    try {
      await chrome.storage.sync.set({ apiKey });
      showStatus("API Key saved successfully", "success");
      updateApiKeyVisibility(true);
    } catch (error) {
      showStatus("Error saving API key", "error");
    }
  }

  function changeApiKey() {
    updateApiKeyVisibility(false);
    if (elements.apiKeyInput) elements.apiKeyInput.value = "";
    if (elements.apiKeyInput) elements.apiKeyInput.focus();
  }

  if (elements.saveButton) {
    elements.saveButton.addEventListener("click", saveApiKey);
  }

  if (elements.changeApiKey) {
    elements.changeApiKey.addEventListener("click", changeApiKey);
  }

  if (elements.transcribeBtn) {
    elements.transcribeBtn.addEventListener(
      "click",
      throttle(async function () {
        console.log("=== TRANSCRIBE BUTTON PRESSED ===");

        const result = await chrome.storage.sync.get(["apiKey"]);
        const apiKey = result.apiKey;

        if (!apiKey) {
          console.log("Error: API key not provided");
          showStatus("Please enter your OpenAI API key", "error");
          return;
        }

        console.log("API key available (length):", apiKey.length);
        elements.transcribeBtn.disabled = true;
        showStatus("Processing video...", "success");

        try {
          console.log("Getting current tab...");
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          if (!tabs || tabs.length === 0) {
            console.error("No active tab found");
            throw new Error("No active tab found");
          }

          const tab = tabs[0];
          console.log("Tab URL:", tab.url);

          if (
            !tab.url ||
            (!tab.url.includes("youtube.com/watch") &&
              !tab.url.includes("m.youtube.com/watch"))
          ) {
            console.error("URL is not a YouTube video");
            throw new Error("Not a YouTube video page");
          }

          try {
            console.log("Injecting content script...");
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
            console.log("Content script injected successfully");
          } catch (injectError) {
            console.warn(
              "Error injecting script, it may already be injected:",
              injectError
            );
          }

          const sendMessageWithTimeout = (tabId, message, timeout = 60000) => {
            console.log(
              "Sending message to content script with timeout:",
              timeout,
              "ms"
            );
            return new Promise((resolve, reject) => {
              const timer = setTimeout(() => {
                console.error("Timeout sending message to content script");
                reject(new Error("Timeout sending message to content script"));
              }, timeout);

              chrome.tabs.sendMessage(tabId, message, (response) => {
                clearTimeout(timer);
                if (chrome.runtime.lastError) {
                  console.error(
                    "Runtime error sending message:",
                    chrome.runtime.lastError
                  );
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  console.log(
                    "Response received from content script:",
                    response
                  );
                  resolve(response);
                }
              });
            });
          };

          console.log("Sending message 'transcribe' to content script...");
          const response = await sendMessageWithTimeout(
            tab.id,
            {
              action: "transcribe",
              apiKey: apiKey,
            },
            60000
          );

          if (response && response.success) {
            console.log("Transcription and summary successful");
            showTranscriptSuccess(response);
          } else {
            console.error("Response indicates error:", response?.error);
            showStatus(response?.error || "Failed to process video", "error");
          }
        } catch (error) {
          console.error("Error in complete process:", error);

          if (error.message.includes("Timeout")) {
            console.error("Timeout error");
            showStatus(
              "Timed out while processing. The video might be too long or doesn't have captions.",
              "error"
            );
          } else if (error.message.includes("Cannot access contents of url")) {
            console.error("Permission error");
            showStatus(
              "Extension doesn't have permission for this page. Try refreshing and trying again.",
              "error"
            );
          } else {
            console.error("Generic error:", error.message);
            showStatus("Error: " + error.message, "error");
          }
        } finally {
          console.log("=== END OF TRANSCRIPTION PROCESS ===");
          elements.transcribeBtn.disabled = false;
        }
      }, 1000)
    );
  }

  if (elements.checkPageButton) {
    elements.checkPageButton.addEventListener(
      "click",
      throttle(function () {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            const currentTab = tabs[0];

            if (!currentTab.url) {
              showStatus("Could not determine the page URL", "error");
              return;
            }

            if (currentTab.url.includes("youtube.com/watch")) {
              showStatus(
                "You are on a YouTube video page. Click the transcript button on the video to capture the transcript.",
                "success"
              );

              chrome.tabs.sendMessage(
                currentTab.id,
                { action: "checkTranscript" },
                function (response) {
                  if (chrome.runtime.lastError) {
                    injectContentScript(currentTab.id);
                    return;
                  }

                  if (response && response.transcriptAvailable) {
                    showStatus(
                      "Transcript button found! Click it to capture the transcript.",
                      "success"
                    );
                  } else {
                    showStatus(
                      "Transcript button not found. This video might not have a transcript available.",
                      "error"
                    );
                  }
                }
              );
            } else {
              showStatus(
                "You are not on a YouTube video page. Please navigate to a YouTube video and try again.",
                "error"
              );
            }
          }
        );
      }, 1000)
    );
  }

  function showStatus(message, type) {
    console.log(`Showing status (${type}):`, message);
    if (elements.statusDiv) {
      elements.statusDiv.textContent = message;
      elements.statusDiv.className =
        type === "success" ? "status success" : "status error";
      elements.statusDiv.style.display = "block";
    }
  }

  function clearStatus() {
    if (elements.statusDiv) {
      elements.statusDiv.style.display = "none";
      elements.statusDiv.textContent = "";
    }
  }

  function showTranscriptSuccess(response) {
    if (!elements.statusDiv || !elements.summaryContainer) return;

    const summaryLanguage = elements.languageSelect
      ? elements.languageSelect.value
      : "auto";
    const isDark = document.body.classList.contains("dark-theme");

    let languageLabel = "original language";
    if (summaryLanguage && summaryLanguage !== "auto") {
      const languageMap = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ru: "Russian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
      };
      languageLabel = languageMap[summaryLanguage] || summaryLanguage;
    }

    elements.statusDiv.className = "success";
    elements.statusDiv.innerHTML = `
      <div><i class="fas fa-check-circle"></i>Transcript extracted successfully${
        summaryLanguage === "auto"
          ? " and summarized in the original language"
          : summaryLanguage !== "auto"
          ? ` and summarized in ${languageLabel}`
          : ""
      }</div>
      <div class="status-subtext">Summary is also displayed on the video page</div>
    `;

    if (response.summary) {
      elements.summaryContainer.style.display = "block";
      elements.summaryContainer.innerHTML = `
        <h3>Summary${
          summaryLanguage !== "auto" ? ` (${languageLabel})` : ""
        }:</h3>
        <div class="summary-content">${response.summary}</div>
        <button id="copyButton" class="btn btn-secondary">
          <i class="fas fa-copy"></i> Copy
        </button>
      `;

      const copyButton = document.getElementById("copyButton");
      if (copyButton) {
        copyButton.addEventListener("click", function () {
          navigator.clipboard
            .writeText(response.summary)
            .then(() => {
              this.innerHTML = '<i class="fas fa-check"></i> Copied!';
              setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i> Copy';
              }, 2000);
            })
            .catch((err) => {
              console.error("Could not copy text: ", err);
              this.innerHTML = '<i class="fas fa-times"></i> Error';
              setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i> Copy';
              }, 2000);
            });
        });
      }
    }
  }

  function injectContentScript(tabId) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["youtube-transcript.js"],
      },
      function () {
        console.log("Content script injected");
        showStatus(
          "Extension activated. Click the transcript button on the video to capture the transcript.",
          "success"
        );
      }
    );
  }

  if (elements.extractButton) {
    elements.extractButton.addEventListener(
      "click",
      throttle(function () {
        console.log("Extract button clicked");
        elements.extractButton.disabled = true;
        showStatus("Working...", "success");

        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            console.log("Tabs query completed:", tabs);
            if (!tabs || tabs.length === 0) {
              showStatus("No active tab found", "error");
              elements.extractButton.disabled = false;
              return;
            }

            const currentTab = tabs[0];
            console.log("Current tab:", currentTab);

            if (
              !currentTab.url ||
              (!currentTab.url.includes("youtube.com/watch") &&
                !currentTab.url.includes("m.youtube.com/watch"))
            ) {
              showStatus("Please navigate to a YouTube video first", "error");
              elements.extractButton.disabled = false;
              return;
            }

            const apiKey = elements.apiKeyInput
              ? elements.apiKeyInput.value.trim()
              : "";
            const summaryLanguage = elements.languageSelect
              ? elements.languageSelect.value
              : "auto";

            if (!apiKey) {
              showStatus("Please enter your OpenAI API key", "error");
              elements.extractButton.disabled = false;
              return;
            }

            chrome.storage.sync.set({
              openai_api_key: apiKey,
              summaryLanguage: summaryLanguage,
            });

            function executeTranscriptExtraction() {
              console.log("Executing direct transcript extraction");

              if (window.isExtractionInProgress) {
                console.log(
                  "Extraction already in progress, ignoring duplicate call"
                );
                return;
              }

              window.isExtractionInProgress = true;

              chrome.scripting.executeScript(
                {
                  target: { tabId: currentTab.id },
                  function: extractAndSummarizeInPage,
                  args: [apiKey, summaryLanguage],
                },
                (results) => {
                  console.log("Script execution results:", results);
                  elements.extractButton.disabled = false;
                  window.isExtractionInProgress = false;

                  if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);

                    let errorMessage = "Error communicating with the page";
                    try {
                      if (chrome.runtime.lastError.message) {
                        errorMessage = chrome.runtime.lastError.message;
                      } else if (typeof chrome.runtime.lastError === "string") {
                        errorMessage = chrome.runtime.lastError;
                      } else {
                        errorMessage = JSON.stringify(chrome.runtime.lastError);
                      }
                    } catch (e) {
                      console.error("Error processing error object:", e);
                    }

                    console.log("Detailed error:", errorMessage);

                    window.responseHandled = true;
                    executeTranscriptExtraction();
                    return;
                  }

                  if (!results || !results[0]) {
                    showStatus(
                      "Failed to execute transcript extraction",
                      "error"
                    );
                    return;
                  }

                  const result = results[0].result;
                  if (result.error) {
                    showStatus("Error: " + result.error, "error");
                  } else if (result.success && result.summary) {
                    showTranscriptSuccess({
                      success: true,
                      summary: result.summary,
                    });
                    showStatus(
                      "Transcript extracted and summarized successfully",
                      "success"
                    );
                  } else {
                    showStatus("Unknown error occurred", "error");
                  }
                }
              );
            }

            try {
              console.log("Attempting to send message to content script");

              window.responseHandled = false;

              let messageTimeout;
              const handleMessageTimeout = () => {
                console.log(
                  "Message timeout occurred, checking if response was handled"
                );
                if (!window.responseHandled) {
                  console.log(
                    "No response was handled, trying direct execution"
                  );
                  window.responseHandled = true;
                  executeTranscriptExtraction();
                }
              };

              chrome.tabs.sendMessage(
                currentTab.id,
                {
                  action: "extract_and_summarize",
                  apiKey: apiKey,
                  summaryLanguage: summaryLanguage,
                },
                function (response) {
                  clearTimeout(messageTimeout);
                  console.log("Message response received:", response);

                  if (window.responseHandled) {
                    console.log("Response already handled, ignoring this one");
                    return;
                  }

                  if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);

                    let errorMessage = "Error communicating with the page";
                    try {
                      if (chrome.runtime.lastError.message) {
                        errorMessage = chrome.runtime.lastError.message;
                      } else if (typeof chrome.runtime.lastError === "string") {
                        errorMessage = chrome.runtime.lastError;
                      } else {
                        errorMessage = JSON.stringify(chrome.runtime.lastError);
                      }
                    } catch (e) {
                      console.error("Error processing error object:", e);
                    }

                    console.log("Detailed error:", errorMessage);

                    window.responseHandled = true;
                    executeTranscriptExtraction();
                    return;
                  }

                  if (!response) {
                    console.log("No response, trying direct execution");
                    window.responseHandled = true;
                    executeTranscriptExtraction();
                    return;
                  }

                  window.responseHandled = true;
                  elements.extractButton.disabled = false;

                  if (response.error) {
                    showStatus("Error: " + response.error, "error");
                  } else if (response.success && response.summary) {
                    showTranscriptSuccess(response);
                  } else {
                    showStatus("Unknown error in response", "error");
                  }
                }
              );

              messageTimeout = setTimeout(handleMessageTimeout, 3000);
            } catch (error) {
              console.error("Error sending message:", error);
              executeTranscriptExtraction();
            }
          }
        );
      }, 1000)
    );
  }

  function extractAndSummarizeInPage(apiKey, summaryLanguage) {
    console.log("Extraction script executed in page context");

    try {
      return new Promise(async (resolve) => {
        try {
          console.log("Extracting transcript in page context");

          if (document.querySelector("#youtube-transcript-summary")) {
            console.log("Summary already exists on the page, reusing it");
            const existingSummary = document.querySelector(
              "#youtube-transcript-summary"
            );
            resolve({
              success: true,
              summary: existingSummary.querySelector("p").textContent,
            });
            return;
          }

          const getVideoTitle = () => {
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
              if (element) return element.textContent.trim();
            }
            return "YouTube Video";
          };

          const extractTranscript = async () => {
            console.log("Looking for transcript button");

            const transcriptButtons = document.querySelectorAll("button");
            console.log(
              `Found ${transcriptButtons.length} buttons on the page`
            );

            const transcriptButton = Array.from(transcriptButtons).find(
              (btn) => {
                const hasText =
                  btn.textContent &&
                  (btn.textContent.toLowerCase().includes("transcript") ||
                    btn.textContent.toLowerCase().includes("transcript"));

                const hasLabel =
                  btn.getAttribute("aria-label") &&
                  (btn
                    .getAttribute("aria-label")
                    .toLowerCase()
                    .includes("transcript") ||
                    btn
                      .getAttribute("aria-label")
                      .toLowerCase()
                      .includes("transcript"));

                return hasText || hasLabel;
              }
            );

            if (!transcriptButton) {
              console.log(
                "Transcript button not found directly, trying with menu"
              );

              const moreButtons = document.querySelectorAll(
                'button[aria-label="More actions"], button[aria-label="More actions"]'
              );
              console.log(
                `Found ${moreButtons.length} additional action buttons`
              );

              if (moreButtons.length > 0) {
                let moreButton = null;
                for (const btn of moreButtons) {
                  if (!btn.classList.contains("ytp-button")) {
                    moreButton = btn;
                    break;
                  }
                }

                if (moreButton) {
                  console.log("Clicking on additional action button");
                  moreButton.click();
                  await new Promise((r) => setTimeout(r, 2000));

                  const menuItems = document.querySelectorAll(
                    "ytd-menu-service-item-renderer, tp-yt-paper-item"
                  );
                  console.log(`Found ${menuItems.length} menu items`);

                  let transcriptItem = Array.from(menuItems).find(
                    (item) =>
                      item &&
                      item.textContent &&
                      (item.textContent.toLowerCase().includes("transcript") ||
                        item.textContent.toLowerCase().includes("transcript"))
                  );

                  if (!transcriptItem) {
                    console.log("Transcript element not found in menu");
                    document.body.click();
                    throw new Error(
                      "Transcript option not found in menu. This video may not have captions available."
                    );
                  }

                  console.log("Clicking on transcript option in menu");
                  transcriptItem.click();
                  await new Promise((r) => setTimeout(r, 3000));
                } else {
                  console.log("Additional action button not adequate");
                  throw new Error(
                    "More actions button not found. Try refreshing the page."
                  );
                }
              } else {
                console.log("No additional action buttons found");
                throw new Error(
                  "Transcript button not found. This video may not have captions available."
                );
              }
            } else {
              console.log("Clicking direct transcript button");
              transcriptButton.click();
              await new Promise((r) => setTimeout(r, 3000));
            }

            const selectors = [
              "ytd-transcript-segment-renderer",
              "ytd-transcript-body-renderer",
              ".segment-text",
              ".ytd-transcript-segment-renderer",
            ];

            let transcriptItems = null;
            for (const selector of selectors) {
              const items = document.querySelectorAll(selector);
              if (items && items.length > 0) {
                console.log(
                  `Found ${items.length} transcript segments with selector ${selector}`
                );
                transcriptItems = items;
                break;
              }
            }

            if (!transcriptItems || transcriptItems.length === 0) {
              console.log("No transcript segments found");
              throw new Error(
                "No transcript segments found. The video may not have captions."
              );
            }

            let transcript = "";
            transcriptItems.forEach((item) => {
              transcript += item.textContent.trim() + " ";
            });

            console.log(`Transcript obtained: ${transcript.length} characters`);
            return transcript.trim();
          };

          const summarize = async (transcript) => {
            let systemMessage = "";
            let userMessage = "";

            if (summaryLanguage === "auto") {
              systemMessage =
                "You are a helpful assistant that creates concise summaries of video transcripts. " +
                "You will detect the language of the transcript and create the summary in the SAME language as the original transcript.";

              userMessage =
                `Please provide a concise summary of this video transcript. ` +
                `IMPORTANT: Detect the language of the transcript and create the summary in the SAME language as the original transcript. ` +
                `Do NOT translate to English unless the original transcript is already in English.\n\n${transcript}`;
            } else if (summaryLanguage) {
              const languageMap = {
                en: "English",
                es: "Spanish",
                fr: "French",
                de: "German",
                it: "Italian",
                pt: "Portuguese",
                ru: "Russian",
                ja: "Japanese",
                ko: "Korean",
                zh: "Chinese",
              };
              const languageName = languageMap[summaryLanguage] || "English";

              systemMessage = `You are a helpful assistant that creates concise summaries of video transcripts in ${languageName}.`;
              userMessage = `Please provide a concise summary of this video transcript in ${languageName}:\n\n${transcript}`;
            }

            console.log("Calling OpenAI API to summarize");
            try {
              const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
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
                }
              );

              if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(
                  `OpenAI API error (${response.status}): ${JSON.stringify(
                    error
                  )}`
                );
              }

              const data = await response.json();
              console.log("Summary obtained successfully from OpenAI");
              return data.choices[0].message.content;
            } catch (apiError) {
              console.error("Error in OpenAI call:", apiError);
              throw apiError;
            }
          };

          console.log("Getting video title");
          const videoTitle = getVideoTitle();
          console.log("Video title:", videoTitle);

          console.log("Extracting transcript");
          const transcript = await extractTranscript();

          if (!transcript || transcript.length < 50) {
            throw new Error(
              "Transcript is too short or empty. The video may not have captions."
            );
          }

          console.log("Summarizing the transcript");
          const summary = await summarize(transcript);

          console.log("Removing existing summaries");
          const existingSummaries = document.querySelectorAll(
            "#youtube-transcript-summary"
          );
          existingSummaries.forEach((el) => el.remove());

          console.log("Showing result on the page");
          const resultsDiv = document.createElement("div");
          resultsDiv.id = "youtube-transcript-summary";
          resultsDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 500px;
            max-height: 80vh;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            overflow-y: auto;
            font-size: 22px;
            line-height: 1.6;
          `;

          resultsDiv.innerHTML = `
            <h3 style="font-size: 26px; margin-bottom: 20px;">${videoTitle}</h3>
            <h4 style="font-size: 24px; margin-bottom: 20px;">Summary:</h4>
            <p style="font-size: 22px; margin-bottom: 20px; line-height: 1.6;">${summary}</p>
            <button onclick="this.parentElement.remove()" style="
              position: absolute;
              top: 10px;
              right: 10px;
              background: none;
              border: none;
              font-size: 26px;
              cursor: pointer;
              padding: 5px 10px;
            ">×</button>
          `;

          document.body.appendChild(resultsDiv);
          console.log("Summary shown successfully on the page");

          resolve({ success: true, summary: summary });
        } catch (error) {
          console.error("Error in page context:", error);
          resolve({
            success: false,
            error: error.message || "Unknown error in page context",
          });
        }
      });
    } catch (outerError) {
      console.error("General error in injected script:", outerError);
      return {
        success: false,
        error: outerError.message || "General script error",
      };
    }
  }

  console.log("=== POPUP READY ===");
});
