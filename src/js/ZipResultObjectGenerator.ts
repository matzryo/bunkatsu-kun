import JSZip from "jszip";
import { ImagePager } from "./ImagePager";
import { ZipMimeType } from "./MimeType";
import { saveAs } from 'file-saver';

export default class ZipResultObjectGenerator {
    private pager: ImagePager;
    private zip = new JSZip();

    constructor(
        private sourceImage: HTMLImageElement,
        private mimeType: ZipMimeType,
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

export { ZipResultObjectGenerator };