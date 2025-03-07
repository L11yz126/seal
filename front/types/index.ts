

export interface FileType {
    id: number;
    name: string;
    size: number;
    status: 'complete' | 'processing' | 'waiting' | 'error';
    result: string;
    confidence: number;
    progress: number;
    file?: any
}

export interface ListItem {
    date: string;
    id: number;
    filename: string;
    seals: string;
    status: '无效' | '有效';
    imageUrl: string; // 图片地址
    confidence: number;
}

export interface recognitionType {
    id: number;
    imageUrl: string;
    sealCount: number;
    sealType: string;
    sealText: string;
    confidence: number;
}