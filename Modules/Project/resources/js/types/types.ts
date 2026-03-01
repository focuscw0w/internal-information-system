import { User } from '@/types';

export type ProjectStatus = 'active' | 'planning' | 'completed' | 'on_hold' | 'cancelled';
export type WorkloadLevel = 'low' | 'medium' | 'high' | 'overloaded';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'testing' | 'done';
export type ViewMode = 'grid' | 'list';

export interface TeamMember {
    id: number;
    name: string;
    email?: string;
    permissions: string[];
    allocation: number;
}

export interface TeamMemberSettings {
    allocation: number;
    permissions: string[];
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    current_user_permissions: string[];
    status: ProjectStatus;
    workload: WorkloadLevel;
    start_date: string;
    end_date: string;
    actual_start_date: string | null;
    actual_end_date: string | null;
    progress: number;
    capacity_used: number;
    capacity_available: number;
    tasks_total: number;
    tasks_completed: number;
    owner_id: number | null;
    owner?: User;
    team: TeamMember[];
    team_size: number;
    is_overdue: boolean;
    days_remaining: number;
    tasks: Task[];
    allocations: ProjectAllocation[];
    activities?: Activity[];
    created_at: string;
    updated_at: string;
}

export interface ProjectAllocation {
    id: number;
    user_id: number;
    allocated_hours: number;
    used_hours: number;
    percentage: number;
    start_date: string;
    end_date: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface Task {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'testing' | 'done';
    priority: 'low' | 'medium' | 'high';
    estimated_hours: number;
    actual_hours: number;
    due_date: string | null;
    completed_at: string | null;
    assigned_users?: {
        id: number;
        name: string;
    }[];
    created_at: string;
    updated_at: string;
    subtasks?: Subtask[];
    comments?: Comment[];
}

export interface Subtask {
    id: number;
    task_id: number;
    title: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: number;
    body: string;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

export interface Activity {
    id: number;
    project_id: number;
    type: string;
    description: string;
    metadata?: Record<string, unknown>;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}
