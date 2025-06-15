import ytdl from 'ytdl-core';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map quality input to resolution (in pixels)
const qualityMap = {
    '144': 144,
    '240': 240,
    '360': 360,
    '480': 480,
    '720': 720,
    '1080': 1080,
    '1440': 1440,
    '2160': 2160,
};

export async function downloadVideo(url, quality, res) {
    try {
        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize title
        const fileName = `${title}.mp4`;
        const outputPath = join(__dirname, '../../downloads', fileName);

        // Get requested quality in pixels (e.g., '1080' -> 1080)
        const requestedQuality = qualityMap[quality] || 1080; // Default to 1080p if invalid

        // Get available video formats with quality labels
        const videoFormats = info.formats
            .filter(format => format.hasVideo && format.qualityLabel)
            .map(format => ({
                itag: format.itag,
                quality: parseInt(format.qualityLabel.replace('p', '')),
                mimeType: format.mimeType,
            }))
            .filter(format => format.mimeType.includes('video/mp4')); // Prefer mp4

        // Find the highest available quality <= requested quality
        const availableQualities = videoFormats
            .map(format => format.quality)
            .sort((a, b) => b - a); // Sort descending

        let selectedQuality = requestedQuality;
        if (!availableQualities.includes(requestedQuality)) {
            // Select highest quality that's <= requested quality
            selectedQuality = availableQualities.find(q => q <= requestedQuality) || availableQualities[0];
        }

        if (!selectedQuality) {
            throw new Error('No suitable video quality found');
        }

        // Find the format with the selected quality
        const selectedFormat = videoFormats.find(format => format.quality === selectedQuality);

        // Ensure downloads directory exists
        const fs = await import('fs/promises');
        await fs.mkdir(join(__dirname, '../../downloads'), { recursive: true });

        // Download video with selected format
        const videoStream = ytdl(url, { quality: selectedFormat.itag });
        const fileStream = createWriteStream(outputPath);

        // Pipe the video stream to the response
        videoStream.pipe(res);

        // Save the file locally (optional)
        await pipeline(videoStream, fileStream);

        return fileName;
    } catch (error) {
        throw error;
    }
}