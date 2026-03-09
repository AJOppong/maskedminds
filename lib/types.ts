export interface Section {
    id: string;
    title: string;
    description: string;
    icon: string;
    gradient: string;
}

export interface Chat {
    id: string;
    title: string;
    description: string;
    sectionId: string;
    createdAt: string;
    activeUsers: number;
    tags?: string[];
}

export interface Message {
    id: string;
    content: string;
    senderId: string; // 'me' or other uuid
    senderNickname: string;
    createdAt: string;
    isSystem?: boolean;
}
