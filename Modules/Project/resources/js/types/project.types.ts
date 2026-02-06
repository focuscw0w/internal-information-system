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
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  tasksTotal: number;
  tasksCompleted: number;
  capacityUsed: number;
  capacityAvailable: number;
  workload: WorkloadLevel;
  team: TeamMember[];
}