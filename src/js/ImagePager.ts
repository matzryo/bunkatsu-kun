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

export {ImagePager};