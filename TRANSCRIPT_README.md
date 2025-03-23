# YouTube Transcript Capture Extension

This Chrome extension allows you to easily capture the transcript of YouTube videos with a click.

## Features

- Automatically detects YouTube transcript buttons
- Captures the full transcript HTML and text when you click on the transcript button
- Copies the transcript text to your clipboard
- Shows a notification when transcripts are captured
- Works on all YouTube video pages

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing these files

## Usage

1. Navigate to any YouTube video that has a transcript available
2. Click on the transcript button in the YouTube player
3. The transcript will be automatically captured and copied to your clipboard
4. You'll see a notification when the transcript is ready

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `youtube-transcript.js` - Content script that captures the transcript
- `background.js` - Background script for extension functionality

## Requirements

- Chrome browser
- YouTube videos with available transcripts

## How It Works

The extension uses a content script to detect when the transcript button is clicked on a YouTube video page. When clicked, it captures the transcript panel's HTML content and extracts the text, making it available for use.

## Troubleshooting

If the transcript isn't being captured:

1. Make sure the video has a transcript available (not all videos do)
2. Try refreshing the page and clicking the extension icon before clicking the transcript button
3. Check the Chrome console for any error messages
