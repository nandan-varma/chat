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
}

export type User = {
    id: number,
    name: string,
    last_online: string
}

// export let sample_users: User[] = [
//     { id: 1, name: "NV", last_online: "1234567" },
//     { id: 2, name: "JP", last_online: "01234567" },
// ]

