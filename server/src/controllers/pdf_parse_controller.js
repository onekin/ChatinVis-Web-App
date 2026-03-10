import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFParse = require('pdf-parse');

export async function parsePDF(filePath) {
    if (!filePath) {
        throw new Error('filePath is required');
    }
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await PDFParse(dataBuffer);
        console.log('PDF parsed successfully:');
        console.log(`Pages: ${result.numpages}`);
        console.log(`Text length: ${result.text.length}`);
        return result;
    } catch (error) {
        console.error('Error parsing PDF:', error.message);
        throw error;
    }
}
