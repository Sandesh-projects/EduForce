// backend/src/services/pdfParse.js

// REMOVED: import { generateMCQsFromText } from './gemini.services.js';
// This file should ONLY be responsible for PDF text extraction.

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Node.js specific imports for path resolution
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// Get current file and directory paths for resolving workerSrc
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the absolute path to the worker file
const workerAbsolutePath = path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.mjs');

// Convert the absolute path to a file:// URL
GlobalWorkerOptions.workerSrc = pathToFileURL(workerAbsolutePath).toString();

/**
 * Extracts text content from a Base64 encoded PDF.
 * This function uses `pdfjs-dist` to extract text from the PDF.
 *
 * @param {string} base64Pdf - The Base64 encoded string of the PDF file.
 * @returns {Promise<string>} - A promise that resolves with the extracted plain text content.
 * @throws {Error} If no PDF content is provided or text extraction fails.
 */
export const extractTextFromPdf = async (base64Pdf) => { // <-- CHANGED: Exporting 'extractTextFromPdf'
    if (!base64Pdf) {
        throw new Error('No PDF content provided for parsing.');
    }

    // Remove the 'data:application/pdf;base64,' prefix if it exists, to get pure Base64 data
    const base64Data = base64Pdf.startsWith('data:application/pdf;base64,')
        ? base64Pdf.split(',')[1]
        : base64Pdf;

    // Convert the Base64 data into a Node.js Buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    try {
        // Load the PDF document using pdfjs-dist
        const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDocument = await loadingTask.promise;

        let fullText = '';
        // Iterate over each page to extract text content
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Check if any meaningful text was extracted
        if (!fullText || fullText.trim().length === 0) {
            throw new Error('Could not extract meaningful text from the PDF. The PDF might be image-based (scanned) or empty.');
        }

        console.log('PDF text parsed successfully.');
        // Return only the extracted text content (string)
        return fullText;
    } catch (error) {
        console.error('Error in extractTextFromPdf:', error);
        if (error.name === 'MissingPDFException' || error.message.includes('PDF file is not opened')) {
            throw new Error('The uploaded file is not a valid PDF, is corrupted, or cannot be processed.');
        } else {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }
};