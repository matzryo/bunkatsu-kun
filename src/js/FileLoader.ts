export default class FileLoader {
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