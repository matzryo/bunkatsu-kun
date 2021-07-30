import { PdfResultObjectGenerator } from "./PdfResultObjectGenerator";
import { ZipResultObjectGenerator } from "./ZipResultObjectGenerator";
import { PdfMimeType, ZipMimeType, MimeType } from "./MimeType";

class ResultObjectGeneratorFactory {
    static readonly PDF_MIME_TYPES = ['application/pdf'];
    static readonly ZIP_MIME_TYPES = ['image/jpeg', 'image/png'];

    static create(image: HTMLImageElement, mimeType: MimeType) {
        if (ResultObjectGeneratorFactory.PDF_MIME_TYPES.includes(mimeType)) {
            return new PdfResultObjectGenerator(image, mimeType as PdfMimeType);
        } else if (ResultObjectGeneratorFactory.ZIP_MIME_TYPES.includes(mimeType)) {
            return new ZipResultObjectGenerator(image, mimeType as ZipMimeType);
        }
        throw new Error(`Mime type is not supported. Only pdf, jpeg and png are suported. Your file mime type is: ${mimeType}`);
    }
}

export { ResultObjectGeneratorFactory };