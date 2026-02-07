export type ProjectStatus = 'active' | 'planning' | 'completed';
export type WorkloadLevel = 'high' | 'medium' | 'low';
export type ViewMode = 'grid' | 'list';

export interface TeamMember {
  name: string;
  role: string;
  allocation: number;
}

export interface Project {
    id: number;
    name: string;
    description?: string | null; // 👈 Pridané
    status: ProjectStatus;
    progress: number;
    start_date: string; // 👈 snake_case ako z backendu
    end_date: string;   // 👈 snake_case ako z backendu
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    teamSize: number;
    tasksTotal: number;
    tasksCompleted: number;
    capacityUsed: number;
    capacityAvailable: number;
    workload: WorkloadLevel;
    budget?: number | null; 
    budget_spent?: number;
    owner_id?: number | null;
    team: TeamMember[];
    created_at?: string;
    updated_at?: string;
}