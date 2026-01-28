const PDFParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function parsePDF(filePath) {
    if (!filePath) {
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

module.exports = { parsePDF };
