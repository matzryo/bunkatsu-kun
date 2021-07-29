import jsPDF from "jspdf";
import ImagePager from "./ImagePager";
import ResultObjectGenerator from "./ResultObjectGenerator";
import { PdfMimeType } from "./MimeType";

export default class PdfResultObjectGenerator implements ResultObjectGenerator {
    // 1 mm = 3.779528 px
    static readonly MM_PX_RATIO = 3.779528;
    private pdf = new jsPDF();
    private a4PageWidthMm = this.pdf.internal.pageSize.getWidth();
    private a4PageHeightMm = this.pdf.internal.pageSize.getHeight();
    private a4PageHeightPx = this.a4PageHeightMm * PdfResultObjectGenerator.MM_PX_RATIO;
    private a4PageWidthPx = this.a4PageWidthMm * PdfResultObjectGenerator.MM_PX_RATIO;
    private pager: ImagePager;

    constructor(
        private sourceImage: HTMLImageElement,
        private mimeType: PdfMimeType,
    ) {
        this.pager = new ImagePager(this.sourceImage, this.a4PageWidthPx, this.a4PageHeightPx);
    }

    generate(prefix: string) {
        let i = 0;
        for(let page of this.pager) {
            if (i > 0) {
                this.pdf.addPage();
            }

            // jpegだとPDF最終ページの余白が黒くなるのでpngで出力
            const imageBase64 = page.toDataURL('image/png', 1);
            this.pdf.addImage(imageBase64, 'PNG', 0, 0, this.a4PageWidthMm, this.a4PageHeightMm);
            i++;
        }

        this.pdf.save(`${prefix}_a4_split.pdf`);
    }

}