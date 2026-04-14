export type WeekPoint = {
    week_label: string;
    load_hours: number;
    utilization: number;
};

export type CapacityStatus = 'green' | 'orange' | 'red';

export type CapacityAlert = {
    id: number;
    name: string;
    weekly_utilization: number;
};

export type Person = {
    id: number;
    name: string;
    email: string;
    weekly_capacity_hours: number;
    weekly_load_hours: number;
    weekly_utilization: number;
    monthly_load_hours: number;
    monthly_capacity_hours: number;
    monthly_utilization: number;
    free_capacity_hours: number;
    status: CapacityStatus;
    is_over_capacity: boolean;
    history: WeekPoint[];
};

export type CapacityOverview = {
    capacity_hours: number;
    load_hours: number;
    utilization: number;
};

export type ProjectPrediction = {
    id: number;
    name: string;
    remaining_hours: number;
    available_hours_next_4_weeks: number;
    can_finish: boolean;
    confidence: number;
    days_remaining: number;
    is_overdue: boolean;
};

export type CapacityPrediction = {
    remaining_project_hours: number;
    available_hours_next_4_weeks: number;
    can_finish: boolean;
    confidence: number;
    projects: ProjectPrediction[];
};

export type DashboardData = {
    people: Person[];
    alerts: CapacityAlert[];
    free_people: Person[];
    weekly_overview: CapacityOverview;
    monthly_overview: CapacityOverview;
    prediction: CapacityPrediction;
    history: WeekPoint[];
};

export type BurnDownPoint = {
    week_label: string;
    ideal_remaining: number;
    forecast_remaining: number;
    is_deadline_week: boolean;
};

export type SimulationData = {
    project_id: number;
    project_name: string;
    baseline_deadline: string;
    simulated_deadline: string;
    baseline_remaining_hours: number;
    simulated_remaining_hours: number;
    baseline_weekly_capacity: number;
    simulated_weekly_capacity: number;
    baseline_team_size: number;
    simulated_team_size: number;
    forecast_finish_date: string | null;
    finish_diff_days: number | null;
    will_meet_deadline: boolean;
    burn_down_points: BurnDownPoint[];
};

export type SimulationProject = {
    id: number;
    name: string;
    status: string;
};
