// > 最新版のBabelでは@babel/polyfillではなく、core-jsを利用する方法を推奨されています。しかし、2020年1月現在、core-jsを組み込む方法は注意する点が多くあります（特にIE11で利用可能にするのは難しい）
// > https://ics.media/entry/16028/#webpack-babel-esnext
import "@babel/polyfill";

document.addEventListener("DOMContentLoaded", () => { 
    const input = document.getElementById('original') as HTMLInputElement;
    input.addEventListener('change', () => {
        const originalImage = (input.files as FileList)[0];
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
            alert(`ファイルタイプ ${imageType} は、サポートしていません。jpg, pngのみサポートしています。`);
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
                ctx.canvas.width = width;
                ctx.canvas.height = pageHeight;

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
                    aDownloadLink.download = `${filenameWithoutExtension}_a4_part${i+1}.png`;
                    aDownloadLink.href = canvas.toDataURL();
                    aDownloadLink.click();

                    // 不要になった描画内容を消さないと、最終ページの余白部分にひとつ前のページの内容が出てしまう
                    ctx.clearRect(0, 0, width, pageHeight);
                }
            }
        }

    })
});