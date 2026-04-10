// ── Core dashboard types (mirrors backend CapacityCalculator output) ─────────

export type WeekPoint = { week_label: string; load_hours: number; utilization: number };

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
    status: 'green' | 'orange' | 'red';
    is_over_capacity: boolean;
    history: WeekPoint[];
};

export type Alert = { id: number; name: string; weekly_utilization: number };

export type Overview = { capacity_hours: number; load_hours: number; utilization: number };

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

export type DashboardSnapshot = {
    people: Person[];
    alerts: Alert[];
    free_people: Person[];
    weekly_overview: Overview;
    monthly_overview: Overview;
    prediction: {
        remaining_project_hours: number;
        available_hours_next_4_weeks: number;
        can_finish: boolean;
        confidence: number;
        projects: ProjectPrediction[];
    };
    history: WeekPoint[];
};

// ── Delta ─────────────────────────────────────────────────────────────────────

export type UserDelta = {
    id: number;
    name: string;
    weekly_util_before: number;
    weekly_util_after: number;
    free_capacity_before: number;
    free_capacity_after: number;
};

export type ProjectDelta = {
    id: number;
    name: string;
    can_finish_before: boolean;
    can_finish_after: boolean;
    confidence_before: number;
    confidence_after: number;
    days_remaining_before: number;
    days_remaining_after: number;
    is_overdue_before: boolean;
    is_overdue_after: boolean;
};

export type SimulationDelta = {
    weekly_utilization_pp: number;
    monthly_utilization_pp: number;
    confidence_pp: number;
    remaining_project_hours_delta: number;
    users_over_capacity_added: { id: number; name: string; before: number; after: number }[];
    users_over_capacity_resolved: { id: number; name: string; before: number; after: number }[];
    projects_at_risk_added: { id: number; name: string; hours_short: number }[];
    projects_at_risk_resolved: { id: number; name: string }[];
    per_user: UserDelta[];
    per_project: ProjectDelta[];
};

// ── Suggestions ───────────────────────────────────────────────────────────────

export type SuggestionSeverity = 'critical' | 'warning' | 'info';

export type SimulationSuggestion = {
    id: string;
    type: string;
    severity: SuggestionSeverity;
    title: string;
    rationale: string;
    proposed_change: Partial<SimulationInputPayload>;
    affects: { user_id?: number; project_id?: number };
};

// ── Input payload (sent to POST /simulation/run) ──────────────────────────────

export type AllocationOverride = {
    project_id: number;
    user_id: number;
    allocation_id?: number | null;
    allocated_hours?: number | null;
    percentage?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    delete?: boolean;
};

export type DeadlineOverride = {
    project_id: number;
    new_end_date: string;
};

export type TeamChange = {
    project_id: number;
    user_id: number;
    action: 'add' | 'remove';
};

export type SimulationInputPayload = {
    capacity_overrides: Record<number, number>;
    allocation_overrides: AllocationOverride[];
    deadline_overrides: DeadlineOverride[];
    team_changes: TeamChange[];
};

// ── Full simulation result ────────────────────────────────────────────────────

export type SimulationResult = {
    baseline: DashboardSnapshot;
    simulated: DashboardSnapshot;
    delta: SimulationDelta;
    suggestions: SimulationSuggestion[];
    input: SimulationInputPayload;
};

// ── Page props ────────────────────────────────────────────────────────────────

export type UserOption = { id: number; name: string };
export type ProjectOption = { id: number; name: string; end_date: string | null };
export type AllocationRecord = {
    id: number;
    project_id: number;
    user_id: number;
    allocated_hours: number;
    used_hours: number;
    percentage: number;
    start_date: string;
    end_date: string;
    notes: string | null;
    project: { id: number; name: string };
    user: { id: number; name: string };
    remaining_hours: number;
    utilization_percentage: number;
};
