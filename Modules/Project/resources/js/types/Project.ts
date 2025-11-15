export interface Project {
    id: number;
    name: string;
    client: string | null;
    description: string | null;
    status: string;
    priority: string;
    start_date: string | null;
    due_date: string | null;
    tags: string | null;
    created_at: string;
    updated_at: string;
}
