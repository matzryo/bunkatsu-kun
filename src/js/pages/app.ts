// > 最新版のBabelでは@babel/polyfillではなく、core-jsを利用する方法を推奨されています。しかし、2020年1月現在、core-jsを組み込む方法は注意する点が多くあります（特にIE11で利用可能にするのは難しい）
// > https://ics.media/entry/16028/#webpack-babel-esnext
import "@babel/polyfill";
import { jsPDF } from "jspdf";

document.addEventListener("DOMContentLoaded", () => { 
    const input = document.getElementById('original') as HTMLInputElement;
    input.addEventListener('change', () => {
        const originalImage = (input.files as FileList)[0];
        if (originalImage === undefined) {
            // セットした画像ファイルを消去した場合
            return;
        }

        const filenameWithoutExtension = originalImage.name.split('.').slice(0, -1).join('.');

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

        // 画像の大きさを取得
        const reader = new FileReader();
        const image = new Image();

        reader.readAsDataURL(originalImage);
        reader.onload = e => {
            image.src = e.target?.result as string;
            image.onload = () => {
                const width = image.width;
                const height = image.height;

                // A4: W210mm x H297mm
                const aspectRatio = 297 / 210;
                const pageHeight = width * aspectRatio;

                const numberOfPages = Math.ceil(height /pageHeight);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                const mime = (document.querySelector('input[name="mime"]:checked') as HTMLInputElement).value;

                if (mime === 'application/pdf') {
                    // pdfの場合
                    // 一度canvasに描画、それをPDFに挿入する

                    const pdf = new jsPDF();
                    const a4PageWidthMm = pdf.internal.pageSize.getWidth();
                    const a4PageHeightMm = pdf.internal.pageSize.getHeight();
                    // 1 mm = 3.779528 px
                    const mmPxRatio = 3.779528;
                    const a4PageHeightPx = a4PageHeightMm * mmPxRatio;
                    const a4PageWidthPx = a4PageWidthMm * mmPxRatio;

                    ctx.canvas.width = a4PageWidthPx;
                    ctx.canvas.height = a4PageHeightPx;

                    for (let i = 0; i < numberOfPages; i++) {
                        if (i > 0) {
                            pdf.addPage();
                        }
                        let sx = 0;
                        let sy = pageHeight * i;
                        let sWidth = width;
                        let sHeight = pageHeight;
                        let dx = 0;
                        let dy = 0;
                        let dWidth = a4PageWidthPx;
                        let dHeight = a4PageHeightPx;
                        ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
                        // jpegだとPDF最終ページの余白が黒くなるのでpngで出力
                        const imageBase64 = canvas.toDataURL('image/png', 1);

                        pdf.addImage(imageBase64, 'PNG', 0, 0, a4PageWidthMm, a4PageHeightMm);
                        // 不要になった描画内容を消さないと、最終ページの余白部分にひとつ前のページの内容が出てしまう
                        ctx.clearRect(0, 0, width, pageHeight);
                    }
                    // ctx.drawImage(image, 0, 0, width, height, 0, 0, a4PageWidthPx, height * (a4PageWidthPx / width));
                    // const imageBase64 = canvas.toDataURL('image/jpeg', 1);
                    
                    pdf.save(`${filenameWithoutExtension}_a4.${mime.split('/')[1]}`);
                } else {
                    ctx.canvas.width = width;
                    ctx.canvas.height = pageHeight;
                    // jpeg, pngの場合
                    for (let i = 0; i < numberOfPages; i++) {
                        let sx = 0;
                        let sy = pageHeight * i;
                        let sWidth = width;
                        let sHeight = pageHeight;
                        let dx = 0;
                        let dy = 0;
                        let dWidth = width;
                        let dHeight = pageHeight;
                        ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

                        const aDownloadLink = document.createElement('a');

                        // ダウンロードさせる
                        aDownloadLink.download = `${filenameWithoutExtension}_a4_part${i+1}.${mime.split('/')[1]}`;
                        // pngの場合encoderOptions指定は無意味
                        aDownloadLink.href = canvas.toDataURL(mime, 1);
                        aDownloadLink.click()

                        // 不要になった描画内容を消さないと、最終ページの余白部分にひとつ前のページの内容が出てしまう
                        ctx.clearRect(0, 0, width, pageHeight);
                    }
                }
            }
        }
    })
});