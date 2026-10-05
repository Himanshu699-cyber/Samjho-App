import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { createWorker } from 'tesseract.js';
import { DocumentPage } from '../types';

// Set up pdf.js worker using Vite's local bundled worker asset
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (err) {
    console.warn('Failed to configure pdfWorker URL:', err);
  }
}

export interface ExtractionProgressCallback {
  (stage: 'reading_pdf' | 'extracting_text' | 'running_ocr' | 'finalizing', percent: number, message: string): void;
}

export async function extractTextFromPDF(
  file: File | ArrayBuffer,
  onProgress?: ExtractionProgressCallback
): Promise<{ pages: DocumentPage[]; fullText: string; isScanned: boolean }> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    onProgress?.('reading_pdf', 15, 'Loading PDF document...');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const extractedPages: DocumentPage[] = [];
    let totalTextChars = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.('extracting_text', Math.round(20 + (pageNum / numPages) * 30), `Extracting text from page ${pageNum} of ${numPages}...`);
      
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0);
      
      const pageText = pageStrings.join(' ');
      totalTextChars += pageText.trim().length;

      // Also render canvas preview if possible
      let canvasDataUrl: string | undefined = undefined;
      try {
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport, canvas } as any)).promise;
          canvasDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (renderErr) {
        // Non-fatal if canvas preview generation fails
      }

      extractedPages.push({
        pageNumber: pageNum,
        text: pageText,
        canvasImage: canvasDataUrl,
      });
    }

    // Check if the PDF is scanned (very little or no selectable text)
    const averageCharsPerPage = totalTextChars / Math.max(1, numPages);
    const isScanned = averageCharsPerPage < 35;

    if (isScanned) {
      onProgress?.('running_ocr', 55, 'No selectable text found. Scanned document detected. Starting Tesseract OCR...');
      
      const ocrPages: DocumentPage[] = [];
      const worker = await createWorker('eng');

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        onProgress?.('running_ocr', Math.round(55 + (pageNum / numPages) * 35), `OCR scanning page ${pageNum} of ${numPages}...`);
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport, canvas } as any)).promise;
          const ret = await worker.recognize(canvas);
          ocrPages.push({
            pageNumber: pageNum,
            text: ret.data.text || '',
            canvasImage: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
      }

      await worker.terminate();

      const fullText = ocrPages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
      onProgress?.('finalizing', 100, 'OCR extraction complete!');
      return { pages: ocrPages, fullText, isScanned: true };
    }

    const fullText = extractedPages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
    onProgress?.('finalizing', 100, 'Text extraction complete!');
    return { pages: extractedPages, fullText, isScanned: false };
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: ExtractionProgressCallback
): Promise<{ pages: DocumentPage[]; fullText: string; isScanned: boolean }> {
  try {
    onProgress?.('running_ocr', 20, 'Initializing OCR engine for image...');
    const worker = await createWorker('eng');

    onProgress?.('running_ocr', 50, 'Recognizing text from image...');
    const ret = await worker.recognize(imageFile);
    await worker.terminate();

    const imagePreviewUrl = URL.createObjectURL(imageFile);

    const pages: DocumentPage[] = [
      {
        pageNumber: 1,
        text: ret.data.text || '',
        canvasImage: imagePreviewUrl,
      },
    ];

    onProgress?.('finalizing', 100, 'Image OCR complete!');
    return {
      pages,
      fullText: ret.data.text || '',
      isScanned: true,
    };
  } catch (err: any) {
    console.error('Image OCR error:', err);
    throw new Error(`Failed to OCR image: ${err.message}`);
  }
}
