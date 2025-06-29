// Service for PDF text extraction
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// Resolve worker path for pdfjs-dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerAbsolutePath = path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = pathToFileURL(workerAbsolutePath).toString();

/**
 * Extracts text content from a Base64 encoded PDF.
 * @param {string} base64Pdf - The Base64 encoded PDF string.
 * @returns {Promise<string>} - A promise resolving to the extracted text.
 * @throws {Error} If no PDF content or text extraction fails.
 */
export const extractTextFromPdf = async (base64Pdf) => {
    if (!base64Pdf) {
        throw new Error('No PDF content provided for parsing.');
    }

    // Remove data URI prefix if present
    const base64Data = base64Pdf.startsWith('data:application/pdf;base64,')
        ? base64Pdf.split(',')[1]
        : base64Pdf;

    // Convert Base64 to Buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    try {
        // Load PDF document
        const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDocument = await loadingTask.promise;

        let fullText = '';
        // Extract text from each page
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Check if meaningful text was extracted
        if (!fullText || fullText.trim().length === 0) {
            throw new Error('Could not extract meaningful text from the PDF. The PDF might be image-based (scanned) or empty.');
        }

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