export interface TimeEntry {
    id: number;
    project_id: number;
    task_id: number;
    user_id: number;
    entry_date: string;
    hours: number;
    description: string | null;
    task?: {
        id: number;
        title: string;
    };
    user?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface TimeEntryFilters {
    user_id: number | null;
    task_id: number | null;
    date_from: string | null;
    date_to: string | null;
}
