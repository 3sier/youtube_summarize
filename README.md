# YouTube Video Transcriber & Summarizer Chrome Extension

This Chrome extension allows you to transcribe YouTube videos and generate summaries using ChatGPT.

## Features

- Transcribes YouTube videos automatically
- Generates concise summaries using ChatGPT
- Clean and user-friendly interface
- Secure API key storage

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing these files

## Usage

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Click the extension icon in your Chrome toolbar
3. Enter your OpenAI API key
4. Navigate to any YouTube video
5. Click the "Transcribe & Summarize Video" button
6. Wait for the transcription and summary to appear

## Requirements

- Chrome browser
- OpenAI API key
- YouTube video with available captions/transcript

## Note

The extension requires the video to have available captions or transcripts. If a video doesn't have captions, the transcription feature won't work.

## Privacy

Your OpenAI API key is stored securely in Chrome's storage and is only used when you explicitly request a transcription and summary.

# Character Gallery

A simple web application that displays a gallery of character images. When you click on an image, it shows details about the character including:

- Name
- Species
- Gender

## Usage

1. Open `index.html` in your web browser
2. Click on any character image to view their details
3. Click the X button or anywhere outside the modal to close the details view

## Customizing Characters

To add or modify characters, edit the `characters.js` file:

```javascript
// Example character format
{
    id: 1,                           // Unique identifier
    name: "Character Name",          // Character name
    species: "Character Species",    // Character species
    gender: "Character Gender",      // Character gender
    image: "path/to/image.jpg"       // Path to character image
}
```

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling for the gallery and modals
- `characters.js` - Character data and JavaScript functionality

## Features

- Responsive grid layout that works on desktop and mobile devices
- Modal popup for displaying character details
- Easy to customize with your own character data
