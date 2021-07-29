// > 最新版のBabelでは@babel/polyfillではなく、core-jsを利用する方法を推奨されています。しかし、2020年1月現在、core-jsを組み込む方法は注意する点が多くあります（特にIE11で利用可能にするのは難しい）
// > https://ics.media/entry/16028/#webpack-babel-esnext
import "@babel/polyfill";
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import JSZip, { file } from "jszip";

document.addEventListener("DOMContentLoaded", () => { 
    const input = document.getElementById('original') as HTMLInputElement;
    input.addEventListener('change', async () => {
        const originalImage = (input.files as FileList)[0];
        if (originalImage === undefined) {
            // セットした画像ファイルを消去した場合
            return;
        }

        // 拡張子からファイルタイプを推測
        const typeMatch = originalImage.name.match(/\.([^.]*)$/);
        if (!typeMatch) {
            alert("画像のファイルタイプが不明です。");
            return;
        }

        // サポートしているファイルタイプかどうかを判定
        const imageType = typeMatch[1].toLowerCase();
        if (imageType != "jpg" && imageType != "jpeg" && imageType != "png") {
            alert(`ファイルタイプ ${imageType} は、サポートしていません。jpg, jpeg, pngのみサポートしています。`);
            return;
        }

        const image = await FileLoader.load(originalImage);
        const mimeType = (document.querySelector('input[name="mime"]:checked') as HTMLInputElement).value as MimeType;
        const generator = ResultObjectGeneratorFactory.create(image, mimeType);
        const filenameWithoutExtension = originalImage.name.split('.').slice(0, -1).join('.');

        generator.generate(filenameWithoutExtension);
    })
});

type PdfMimeType = 'application/pdf';
type ZipMimeType = 'image/jpeg' | 'image/png';
type MimeType = PdfMimeType | ZipMimeType;

class ResultObjectGeneratorFactory {
    static readonly PDF_MIME_TYPES = ['application/pdf'];
    static readonly ZIP_MIME_TYPES = ['image/jpeg', 'image/png'];

    static create(image: HTMLImageElement, mimeType: MimeType) {
        if (ResultObjectGeneratorFactory.PDF_MIME_TYPES.includes(mimeType)) {
            return new PdfResultObjectGenerator(image, mimeType);
        } else if (ResultObjectGeneratorFactory.ZIP_MIME_TYPES.includes(mimeType)) {
            return new ZipResultObjectGenerator(image, mimeType);
        }
        throw new Error(`Mime type is not supported. Only pdf, jpeg and png are suported. Your file mime type is: ${mimeType}`);
    }
}

class FileLoader {
    // 素朴にImagePager.constructor内でFileの中身を読み込みたくなる。しかしそうすると非同期処理になる。コード上後にくる処理(例: PdfResultObjectGenerator.generate)が先に実行されしまう懸念がある。
    static async load(sourceImage: File) {
        const filereader = await FileLoader.fileReaderLoad(sourceImage).catch((e) => {throw e});
        const image = await FileLoader.imageLoad(filereader).catch((e) => {throw e});
        return image;
    }

    static fileReaderLoad(sourceImage: File): Promise<FileReader> {
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader);
            reader.onerror = reject
            reader.readAsDataURL(sourceImage);
        })
    }

    static imageLoad(reader: FileReader): Promise<HTMLImageElement> {
        const image = new Image();
        return new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject
            image.src = reader.result as string;
        })
    }
}
class ImagePager {
    // A4: W210mm x H297mm
    static readonly ASPECT_RATIO = 297 / 210;
    private numberOfPages = 1;
    // 画像投影先
    private canvas = document.createElement('canvas');
    private canvasWidth!: number;
    private canvasHeight!: number;
    private heightOfAPage!: number;

    constructor(
        // アップロードされた画像
        public image: HTMLImageElement,
        // 出力したいページのサイズ
        public pageWidth: number | undefined = undefined,
        public pageHeight: number | undefined = undefined,
    ) {
        // 元画像のサイズを取得
        const originalWidth = this.image.width;
        const originalheight = this.image.height;
        // console.log('heightOfAPageが確定した');

        this.heightOfAPage = originalWidth * ImagePager.ASPECT_RATIO;
        this.numberOfPages = Math.ceil(originalheight / this.heightOfAPage);

        // 投影先のサイズを設定
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvasWidth = pageWidth ? pageWidth : this.image.width;
        this.canvasHeight = pageHeight ? pageHeight : this.heightOfAPage;
        ctx.canvas.width = this.canvasWidth;
        ctx.canvas.height = this.canvasHeight;
    }

    // Symbol.iteratorで反復可能プロトコルを満たす
    // 反復子 (iterator) プロトコルをジェネレータ(function*)によって満たす
    *[Symbol.iterator]() {
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        const sx = 0;
        const sWidth = this.image.width;
        const sHeight = this.heightOfAPage;
        const dx = 0;
        const dy = 0;
        const dWidth = this.canvasWidth;
        const dHeight = this.canvasHeight;
        for (let i = 0; i < this.numberOfPages; i++) {
            let sy = this.heightOfAPage * i;
            ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            yield this.canvas;

            // 不要になった描画内容を消さないと、最終ページの余白部分にひとつ前のページの内容が出てしまう
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        return;
    }
}

interface ResultObjectGenerator {
    generate(prefix: string): void
}

class PdfResultObjectGenerator implements ResultObjectGenerator {
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
        private mimeType: MimeType,
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
class ZipResultObjectGenerator {
    private pager: ImagePager;
    private zip = new JSZip();

    constructor(
        private sourceImage: HTMLImageElement,
        private mimeType: MimeType,
    ) {
        this.pager = new ImagePager(this.sourceImage);
    }

    generate(prefix: string) {
        let i = 0;
        for(let page of this.pager) {
            // pngの場合、toDataURLのencoderOptions指定は無意味?
            // data urlの、頭の"data:image/jpeg;base64"の文字列を取りさる
            const base64Image =  page.toDataURL(this.mimeType, 1).split(',')[1];
            let filename = `${prefix}_a4_part${i+1}.${this.getExtension()}`
            this.zip.file(filename, base64Image, {base64: true})
            i++;
        }
        // ダウンロードさせる
        if (!JSZip.support.blob) {
            // 基本ここにはこない。
            // https://developer.mozilla.org/en-US/docs/Web/API/Blob#browser_compatibility
            alert('すみません、あなたがお使いのブラウザはサポート外です。')
            return;
        }

        // zipファイルダウンロード
        const zipFilename = `${prefix}_a4_split.zip`
        this.zip.generateAsync({type: "blob"})
        .then(function (content) {
            saveAs(content, zipFilename);
        });
    }

    private getExtension() {
        return this.mimeType.split('/')[1];
    }
}
