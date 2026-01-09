import { createRequire } from 'module';
// Trigger restart for pdf-parse fix
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Extract text from a buffer based on mimetype
 */
export async function parseDocument(buffer, mimetype) {
    try {
        console.log(`📄 Parsing document of type: ${mimetype}`);

        if (mimetype === 'application/pdf') {
            const data = await pdf(buffer);
            return data.text;
        }

        // Plain text
        if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        }

        throw new Error(`Unsupported file type: ${mimetype}. Please upload a PDF or Text file.`);
    } catch (error) {
        console.error('Document scan error:', error);
        throw new Error('Failed to read document text. ' + error.message);
    }
}
