export type Msg = {
    id: string,
    sender: string,
    content: string,
    timestamp: number,
    encrypted?: boolean
}

export type Room = {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    created_at: number;
    isPasswordProtected?: boolean;
    passwordHash?: string; // Store a hash for password verification
}

export type User = {
    id: number,
    name: string,
    last_online: string
}
