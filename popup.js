document.addEventListener("DOMContentLoaded", function () {
  console.log("=== POPUP INICIALIZADO ===");

  const transcribeBtn = document.getElementById("transcribeBtn");
  const apiKeyInput = document.getElementById("apiKey");
  const statusDiv = document.getElementById("status");
  const checkPageButton = document.getElementById("checkPage");
  const saveButton = document.getElementById("saveApiKey");
  const extractButton = document.getElementById("extractButton");
  const copyButton = document.getElementById("copyButton");
  const summaryContainer = document.getElementById("summaryContainer");
  const languageSelect = document.getElementById("summaryLanguage");
  const themeToggle = document.getElementById("themeToggle");

  console.log("Elements found:", {
    transcribeBtn: !!transcribeBtn,
    apiKeyInput: !!apiKeyInput,
    statusDiv: !!statusDiv,
    checkPageButton: !!checkPageButton,
    saveButton: !!saveButton,
    extractButton: !!extractButton,
    summaryContainer: !!summaryContainer,
    languageSelect: !!languageSelect,
    themeToggle: !!themeToggle,
  });

  // Load saved API key
  chrome.storage.sync.get(
    ["openaiApiKey", "summaryLanguage"],
    function (result) {
      if (result.openaiApiKey) {
        console.log("API key encontrada en almacenamiento");
        if (apiKeyInput) apiKeyInput.value = result.openaiApiKey;
      } else {
        console.log("No se encontró API key en almacenamiento");
      }

      if (result.summaryLanguage && languageSelect) {
        languageSelect.value = result.summaryLanguage;
      }
    }
  );

  // Load saved theme preference
  chrome.storage.sync.get(["theme"], function (result) {
    if (result.theme === "dark") {
      document.body.classList.add("dark-theme");
      themeToggle.textContent = "☀️";
    }
  });

  // Save API key when changed
  if (apiKeyInput) {
    apiKeyInput.addEventListener("change", function () {
      console.log("Guardando nueva API key en almacenamiento");
      chrome.storage.sync.set({
        openaiApiKey: apiKeyInput.value,
      });
    });
  }

  // Save API key and language preference
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
      const language = languageSelect ? languageSelect.value : "auto";

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

  // When language is changed, save the preference
  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      chrome.storage.sync.set({
        summaryLanguage: languageSelect.value,
      });
    });
  }

  // Theme toggle functionality
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      themeToggle.textContent = isDark ? "☀️" : "🌙";

      // Save theme preference
      chrome.storage.sync.set({
        theme: isDark ? "dark" : "light",
      });
    });
  }

  // Función para verificar si hay una API key guardada
  async function checkApiKey() {
    const result = await chrome.storage.sync.get(["apiKey"]);
    if (result.apiKey) {
      document.getElementById("apiKeyGroup").style.display = "none";
      document.getElementById("apiKeySaved").style.display = "block";
    } else {
      document.getElementById("apiKeyGroup").style.display = "block";
      document.getElementById("apiKeySaved").style.display = "none";
    }
  }

  // Función para guardar la API key
  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus("Por favor, ingresa una API key", "error");
      return;
    }

    try {
      await chrome.storage.sync.set({ apiKey });
      showStatus("API Key guardada correctamente", "success");
      document.getElementById("apiKeyGroup").style.display = "none";
      document.getElementById("apiKeySaved").style.display = "block";
    } catch (error) {
      showStatus("Error al guardar la API key", "error");
    }
  }

  // Función para cambiar la API key
  function changeApiKey() {
    document.getElementById("apiKeyGroup").style.display = "block";
    document.getElementById("apiKeySaved").style.display = "none";
    apiKeyInput.value = "";
  }

  // Verificar API key al cargar
  checkApiKey();

  // Event listeners para la API key
  if (saveButton) {
    saveButton.addEventListener("click", saveApiKey);
  }

  if (document.getElementById("changeApiKey")) {
    document
      .getElementById("changeApiKey")
      .addEventListener("click", changeApiKey);
  }

  if (transcribeBtn) {
    transcribeBtn.addEventListener("click", async function () {
      console.log("=== BOTÓN TRANSCRIBE PRESIONADO ===");

      const result = await chrome.storage.sync.get(["apiKey"]);
      const apiKey = result.apiKey;

      if (!apiKey) {
        console.log("Error: API key no proporcionada");
        showStatus("Please enter your OpenAI API key", "error");
        return;
      }

      console.log("API key disponible (longitud):", apiKey.length);
      transcribeBtn.disabled = true;
      showStatus("Processing video...", "success");

      try {
        // Get the current tab
        console.log("Obteniendo tab actual...");
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tabs || tabs.length === 0) {
          console.error("No se encontró tab activa");
          throw new Error("No active tab found");
        }

        const tab = tabs[0];
        console.log("Tab URL:", tab.url);

        if (
          !tab.url ||
          (!tab.url.includes("youtube.com/watch") &&
            !tab.url.includes("m.youtube.com/watch"))
        ) {
          console.error("La URL no es de un video de YouTube");
          throw new Error("Not a YouTube video page");
        }

        // First make sure the content script is injected
        try {
          console.log("Inyectando content script...");
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
          console.log("Content script inyectado correctamente");
        } catch (injectError) {
          console.warn(
            "Error al inyectar script, puede que ya esté inyectado:",
            injectError
          );
          // Continue anyway, as the script might already be there
        }

        // Add a timeout for the message
        const sendMessageWithTimeout = (tabId, message, timeout = 60000) => {
          console.log(
            "Enviando mensaje al content script con timeout:",
            timeout,
            "ms"
          );
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              console.error("Timeout al enviar mensaje al content script");
              reject(new Error("Timeout sending message to content script"));
            }, timeout);

            chrome.tabs.sendMessage(tabId, message, (response) => {
              clearTimeout(timer);
              if (chrome.runtime.lastError) {
                console.error(
                  "Error en runtime al enviar mensaje:",
                  chrome.runtime.lastError
                );
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                console.log("Respuesta recibida del content script:", response);
                resolve(response);
              }
            });
          });
        };

        // Send message to content script with a 60-second timeout
        console.log("Enviando mensaje 'transcribe' al content script...");
        const response = await sendMessageWithTimeout(
          tab.id,
          {
            action: "transcribe",
            apiKey: apiKey,
          },
          60000
        );

        if (response && response.success) {
          console.log("Transcripción y resumen exitosos");
          showTranscriptSuccess(response);
        } else {
          console.error("La respuesta indica error:", response?.error);
          showStatus(response?.error || "Failed to process video", "error");
        }
      } catch (error) {
        console.error("Error en proceso completo:", error);

        // Show more helpful error message based on error type
        if (error.message.includes("Timeout")) {
          console.error("Error de timeout");
          showStatus(
            "Timed out while processing. The video might be too long or doesn't have captions.",
            "error"
          );
        } else if (error.message.includes("Cannot access contents of url")) {
          console.error("Error de permisos");
          showStatus(
            "Extension doesn't have permission for this page. Try refreshing and trying again.",
            "error"
          );
        } else {
          console.error("Error genérico:", error.message);
          showStatus("Error: " + error.message, "error");
        }
      } finally {
        console.log("=== FIN DEL PROCESO DE TRANSCRIPCIÓN ===");
        transcribeBtn.disabled = false;
      }
    });
  }

  // Check if the current page is a YouTube video page
  if (checkPageButton) {
    checkPageButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];

        // Check if the current URL is a YouTube video
        if (currentTab.url.includes("youtube.com/watch")) {
          showStatus(
            "You are on a YouTube video page. Click the transcript button on the video to capture the transcript.",
            "success"
          );

          // Send a message to the content script to check if the transcript button is present
          chrome.tabs.sendMessage(
            currentTab.id,
            { action: "checkTranscript" },
            function (response) {
              if (chrome.runtime.lastError) {
                // Content script might not be injected yet
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
      });
    });
  }

  // Function to show status messages
  function showStatus(message, type) {
    console.log(`Mostrando estado (${type}):`, message);
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className =
        type === "success" ? "status success" : "status error";
      statusDiv.style.display = "block";
    }
  }

  // Function to clear status
  function clearStatus() {
    if (statusDiv) {
      statusDiv.style.display = "none";
      statusDiv.textContent = "";
    }
  }

  // Function to show successful transcript extraction
  function showTranscriptSuccess(response) {
    const statusDiv = document.getElementById("status");
    const summaryContainer = document.getElementById("summaryContainer");
    const summaryLanguage = document.getElementById("summaryLanguage").value;
    const isDark = document.body.classList.contains("dark-theme");

    // Determine language label for display
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

    // Set success message
    statusDiv.className = "success";
    statusDiv.innerHTML = `
      <div><i class="fas fa-check-circle"></i>Transcript extracted successfully${
        summaryLanguage !== "auto" ? ` and summarized in ${languageLabel}` : ""
      }</div>
      <div class="status-subtext">Summary is also displayed on the video page</div>
    `;

    // Display the summary in the popup
    if (response.summary) {
      summaryContainer.style.display = "block";
      summaryContainer.innerHTML = `
        <h3>Summary${
          summaryLanguage !== "auto" ? ` (${languageLabel})` : ""
        }:</h3>
        <div class="summary-content">${response.summary}</div>
        <button id="copyButton" class="btn btn-secondary">
          <i class="fas fa-copy"></i> Copy
        </button>
      `;

      // Add copy functionality
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

  // Function to inject content script
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

  // Extract and summarize transcript
  if (extractButton) {
    extractButton.addEventListener("click", function () {
      console.log("Extract button clicked");
      extractButton.disabled = true;
      showStatus("Working...", "success");

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log("Tabs query completed:", tabs);
        if (!tabs || tabs.length === 0) {
          showStatus("No active tab found", "error");
          extractButton.disabled = false;
          return;
        }

        const currentTab = tabs[0];
        console.log("Current tab:", currentTab);

        // Check if we're on a YouTube page
        if (
          !currentTab.url ||
          (!currentTab.url.includes("youtube.com/watch") &&
            !currentTab.url.includes("m.youtube.com/watch"))
        ) {
          showStatus("Please navigate to a YouTube video first", "error");
          extractButton.disabled = false;
          return;
        }

        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
        const summaryLanguage = languageSelect ? languageSelect.value : "auto";

        if (!apiKey) {
          showStatus("Please enter your OpenAI API key", "error");
          extractButton.disabled = false;
          return;
        }

        // Save settings
        chrome.storage.sync.set({
          openai_api_key: apiKey,
          summaryLanguage: summaryLanguage,
        });

        // Create a function to handle direct script execution
        function executeTranscriptExtraction() {
          console.log("Executing direct transcript extraction");

          // Add a flag to the window to prevent multiple executions
          if (window.isExtractionInProgress) {
            console.log(
              "Extraction already in progress, ignoring duplicate call"
            );
            return;
          }

          window.isExtractionInProgress = true;

          // Execute script directly in the tab context
          chrome.scripting.executeScript(
            {
              target: { tabId: currentTab.id },
              function: extractAndSummarizeInPage,
              args: [apiKey, summaryLanguage],
            },
            (results) => {
              console.log("Script execution results:", results);
              extractButton.disabled = false;
              window.isExtractionInProgress = false;

              if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);

                let errorMessage = "Error de comunicación con la página";
                try {
                  if (chrome.runtime.lastError.message) {
                    errorMessage = chrome.runtime.lastError.message;
                  } else if (typeof chrome.runtime.lastError === "string") {
                    errorMessage = chrome.runtime.lastError;
                  } else {
                    errorMessage = JSON.stringify(chrome.runtime.lastError);
                  }
                } catch (e) {
                  console.error("Error al procesar el objeto de error:", e);
                }

                console.log("Error detallado:", errorMessage);

                // If there's an error with messaging, try direct execution
                window.responseHandled = true;
                executeTranscriptExtraction();
                return;
              }

              if (!results || !results[0]) {
                showStatus("Failed to execute transcript extraction", "error");
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

        // First try to use messaging, fall back to direct execution
        try {
          console.log("Attempting to send message to content script");

          // Global flag to track if we've already handled a response
          window.responseHandled = false;

          // Set a timeout for message response
          let messageTimeout;
          const handleMessageTimeout = () => {
            console.log(
              "Message timeout occurred, checking if response was handled"
            );
            if (!window.responseHandled) {
              console.log("No response was handled, trying direct execution");
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

              // Only proceed if we haven't handled a response yet
              if (window.responseHandled) {
                console.log("Response already handled, ignoring this one");
                return;
              }

              if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);

                let errorMessage = "Error de comunicación con la página";
                try {
                  if (chrome.runtime.lastError.message) {
                    errorMessage = chrome.runtime.lastError.message;
                  } else if (typeof chrome.runtime.lastError === "string") {
                    errorMessage = chrome.runtime.lastError;
                  } else {
                    errorMessage = JSON.stringify(chrome.runtime.lastError);
                  }
                } catch (e) {
                  console.error("Error al procesar el objeto de error:", e);
                }

                console.log("Error detallado:", errorMessage);

                // If there's an error with messaging, try direct execution
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

              // Mark that we've handled a response
              window.responseHandled = true;
              extractButton.disabled = false;

              if (response.error) {
                showStatus("Error: " + response.error, "error");
              } else if (response.success && response.summary) {
                showTranscriptSuccess(response);
              } else {
                showStatus("Unknown error in response", "error");
              }
            }
          );

          // Set timeout to fall back to direct execution if no response
          messageTimeout = setTimeout(handleMessageTimeout, 3000);
        } catch (error) {
          console.error("Error sending message:", error);
          executeTranscriptExtraction();
        }
      });
    });
  }

  // Function to extract and summarize directly in page context
  function extractAndSummarizeInPage(apiKey, summaryLanguage) {
    console.log("Script de extracción ejecutado en contexto de página");

    try {
      // Solo JavaScript básico y APIs web estándar aquí
      // No podemos usar chrome.* APIs dentro de la página
      return new Promise(async (resolve) => {
        try {
          console.log("Extracting transcript in page context");

          // Check if summary already exists on the page
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

          // Get video title
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

          // Simple transcript extraction by clicking the transcript button
          const extractTranscript = async () => {
            console.log("Buscando botón de transcripción");

            // Find transcript button
            const transcriptButtons = document.querySelectorAll("button");
            console.log(
              `Encontrados ${transcriptButtons.length} botones en la página`
            );

            const transcriptButton = Array.from(transcriptButtons).find(
              (btn) => {
                const hasText =
                  btn.textContent &&
                  (btn.textContent.toLowerCase().includes("transcript") ||
                    btn.textContent.toLowerCase().includes("transcripción"));

                const hasLabel =
                  btn.getAttribute("aria-label") &&
                  (btn
                    .getAttribute("aria-label")
                    .toLowerCase()
                    .includes("transcript") ||
                    btn
                      .getAttribute("aria-label")
                      .toLowerCase()
                      .includes("transcripción"));

                return hasText || hasLabel;
              }
            );

            if (!transcriptButton) {
              console.log(
                "Botón de transcripción no encontrado directamente, intentando con menú"
              );

              // Try menu method
              const moreButtons = document.querySelectorAll(
                'button[aria-label="More actions"], button[aria-label="Más acciones"]'
              );
              console.log(
                `Encontrados ${moreButtons.length} botones de acciones adicionales`
              );

              if (moreButtons.length > 0) {
                // Click the more actions button (not in the player)
                let moreButton = null;
                for (const btn of moreButtons) {
                  if (!btn.classList.contains("ytp-button")) {
                    moreButton = btn;
                    break;
                  }
                }

                if (moreButton) {
                  console.log("Haciendo clic en botón de acciones adicionales");
                  moreButton.click();
                  await new Promise((r) => setTimeout(r, 2000)); // Mayor tiempo de espera

                  // Find transcript option
                  const menuItems = document.querySelectorAll(
                    "ytd-menu-service-item-renderer, tp-yt-paper-item"
                  );
                  console.log(
                    `Encontrados ${menuItems.length} elementos de menú`
                  );

                  // Primero buscar por texto exacto luego por coincidencia parcial
                  let transcriptItem = Array.from(menuItems).find(
                    (item) =>
                      item &&
                      item.textContent &&
                      (item.textContent.toLowerCase().includes("transcript") ||
                        item.textContent
                          .toLowerCase()
                          .includes("transcripción"))
                  );

                  if (!transcriptItem) {
                    console.log(
                      "Elemento de transcripción no encontrado en el menú"
                    );
                    // Cerrar el menú que abrimos
                    document.body.click();
                    throw new Error(
                      "Transcript option not found in menu. This video may not have captions available."
                    );
                  }

                  console.log(
                    "Haciendo clic en opción de transcripción en el menú"
                  );
                  transcriptItem.click();
                  await new Promise((r) => setTimeout(r, 3000)); // Mayor tiempo de espera
                } else {
                  console.log("Botón de acciones adicionales no adecuado");
                  throw new Error(
                    "More actions button not found. Try refreshing the page."
                  );
                }
              } else {
                console.log(
                  "No se encontraron botones de acciones adicionales"
                );
                throw new Error(
                  "Transcript button not found. This video may not have captions available."
                );
              }
            } else {
              // Click the direct transcript button
              console.log("Haciendo clic en botón de transcripción directo");
              transcriptButton.click();
              await new Promise((r) => setTimeout(r, 3000)); // Mayor tiempo de espera
            }

            // Get transcript text - intentar con diferentes selectores
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
                  `Encontrados ${items.length} segmentos de transcripción con selector ${selector}`
                );
                transcriptItems = items;
                break;
              }
            }

            if (!transcriptItems || transcriptItems.length === 0) {
              console.log("No se encontraron segmentos de transcripción");
              throw new Error(
                "No transcript segments found. The video may not have captions."
              );
            }

            let transcript = "";
            transcriptItems.forEach((item) => {
              transcript += item.textContent.trim() + " ";
            });

            console.log(
              `Transcripción obtenida: ${transcript.length} caracteres`
            );
            return transcript.trim();
          };

          // Function to call OpenAI API for summarization
          const summarize = async (transcript) => {
            // Determine language for summary
            let systemMessage =
              "You are a helpful assistant that creates concise summaries of video transcripts.";
            let userMessage = `Please provide a concise summary of this video transcript:\n\n${transcript}`;

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
              const languageName = languageMap[summaryLanguage] || "English";

              systemMessage = `You are a helpful assistant that creates concise summaries of video transcripts in ${languageName}.`;
              userMessage = `Please provide a concise summary of this video transcript in ${languageName}:\n\n${transcript}`;
            }

            // Call OpenAI API
            console.log("Llamando a la API de OpenAI para resumir");
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
              console.log("Resumen obtenido correctamente de OpenAI");
              return data.choices[0].message.content;
            } catch (apiError) {
              console.error("Error en llamada a OpenAI:", apiError);
              throw apiError;
            }
          };

          // Main extraction logic
          console.log("Obteniendo título del video");
          const videoTitle = getVideoTitle();
          console.log("Título del video:", videoTitle);

          console.log("Extrayendo transcripción");
          const transcript = await extractTranscript();

          if (!transcript || transcript.length < 50) {
            throw new Error(
              "Transcript is too short or empty. The video may not have captions."
            );
          }

          // Summarize the transcript
          console.log("Resumiendo la transcripción");
          const summary = await summarize(transcript);

          // Remove any existing summary containers first
          console.log("Eliminando resúmenes existentes");
          const existingSummaries = document.querySelectorAll(
            "#youtube-transcript-summary"
          );
          existingSummaries.forEach((el) => el.remove());

          // Display result on page
          console.log("Mostrando resultado en la página");
          const resultsDiv = document.createElement("div");
          resultsDiv.id = "youtube-transcript-summary"; // Add ID for future reference
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
          console.log("Resumen mostrado correctamente en la página");

          // Return success response
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
      // Capturamos cualquier error general que pueda ocurrir fuera de la promesa
      console.error("Error general en el script inyectado:", outerError);
      return {
        success: false,
        error: outerError.message || "General script error",
      };
    }
  }

  console.log("=== POPUP LISTO ===");
});
