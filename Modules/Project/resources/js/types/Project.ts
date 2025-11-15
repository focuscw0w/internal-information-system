export interface Project {
    id: number;
    name: string;
    client: string;
    description: string;
    status: 'planned' | 'active' | 'on_hold' | 'completed';
    priority: 'low' | 'medium' | 'high';
    start_date: string;
    due_date: string;
    tags: string | null;
    created_at: string;
    updated_at: string;
}
