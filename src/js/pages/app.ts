// > 最新版のBabelでは@babel/polyfillではなく、core-jsを利用する方法を推奨されています。しかし、2020年1月現在、core-jsを組み込む方法は注意する点が多くあります（特にIE11で利用可能にするのは難しい）
// > https://ics.media/entry/16028/#webpack-babel-esnext
import "@babel/polyfill";
import FileLoader from "../FileLoader";
import { MimeType } from '../MimeType';
import ResultObjectGeneratorFactory from '../ResultObjectGeneratorFactory';

let image: HTMLImageElement | undefined;
let filenameWithoutExtension: string | undefined;
document.addEventListener("DOMContentLoaded", () => { 
    const input = document.getElementById('original') as HTMLInputElement;
    input.addEventListener('change', async () => {
        const originalImage = (input.files as FileList)[0];
        if (originalImage === undefined) {
            // セットした画像ファイルを消去した場合
            image = undefined;
            filenameWithoutExtension = undefined;
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

        image = await FileLoader.load(originalImage);
        filenameWithoutExtension = originalImage.name.split('.').slice(0, -1).join('.');
    })

    const form = document.getElementById('form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();


        // ブラウザ組み込みのバリデーションが効くので、実際にここを通ることはないはず
        if ((!image || !filenameWithoutExtension)) {
            alert("分割したいファイルをセットしてください。");
            return;
        }

        const mimeType = (document.querySelector('input[name="mime"]:checked') as HTMLInputElement).value as MimeType;

        const generator = ResultObjectGeneratorFactory.create(image, mimeType);
        generator.generate(filenameWithoutExtension);
    })
});
