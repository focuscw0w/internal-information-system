import { Card, CardContent } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertTriangle,
    ChevronDown,
    Clock3,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Person, ProjectPrediction } from '../../types/capacity';

type ExpandedRecommendations = Record<'overloaded' | 'risky' | 'free', boolean>;

type RecommendationsSectionProps = {
    overloadedPeople: Person[];
    riskyProjects: ProjectPrediction[];
    freePeople: Person[];
    expandedRecommendations: ExpandedRecommendations;
    onToggleRecommendation: (key: 'overloaded' | 'risky' | 'free') => void;
};

type RecommendationCardProps = {
    title: string;
    description: string;
    count: number;
    accentClassName: string;
    icon: LucideIcon;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
};

function RecommendationCard({
    title,
    description,
    count,
    accentClassName,
    icon: Icon,
    open,
    onToggle,
    children,
}: RecommendationCardProps) {
    return (
        <Collapsible open={open} onOpenChange={onToggle}>
            <Card className="gap-0 py-0">
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-md p-2 ${accentClassName}`}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">
                                    {title} ({count})
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {description}
                                </p>
                            </div>
                        </div>
                        <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t pb-3">
                    <CardContent className="pt-4">{children}</CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

export function RecommendationsSection({
    overloadedPeople,
    riskyProjects,
    freePeople,
    expandedRecommendations,
    onToggleRecommendation,
}: RecommendationsSectionProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Odporúčané zásahy
                </h2>
            </div>

            <div className="space-y-3">
                <RecommendationCard
                    title="Preťažení ľudia"
                    description="Kde hrozí preťaženie a koho odľahčiť."
                    count={overloadedPeople.length}
                    accentClassName="bg-red-50 text-red-600"
                    icon={AlertTriangle}
                    open={expandedRecommendations.overloaded}
                    onToggle={() => onToggleRecommendation('overloaded')}
                >
                    <ul className="space-y-1 text-sm text-gray-700">
                        {overloadedPeople.length === 0 && (
                            <li>Nikto nie je nad 100 % kapacity.</li>
                        )}

                        {overloadedPeople.map((person) => {
                            const overloadHours = Math.max(
                                0,
                                Math.round(
                                    person.weekly_load_hours -
                                        person.weekly_capacity_hours,
                                ),
                            );

                            return (
                                <li
                                    key={person.id}
                                    className="flex items-start justify-between gap-3 rounded-md"
                                >
                                    <div>
                                        <span className="font-medium text-gray-900">
                                            {person.name}
                                        </span>
                                        <span className="text-gray-600">
                                            {' '}
                                            — približne +{overloadHours}h/týždeň
                                            nad kapacitou
                                        </span>
                                    </div>
                                    <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                        {person.weekly_utilization}%
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </RecommendationCard>

                <RecommendationCard
                    title="Rizikové projekty"
                    description="Kde chýba kapacita do termínu."
                    count={riskyProjects.length}
                    accentClassName="bg-orange-50 text-orange-600"
                    icon={Clock3}
                    open={expandedRecommendations.risky}
                    onToggle={() => onToggleRecommendation('risky')}
                >
                    <ul className="space-y-1 text-sm text-gray-700">
                        {riskyProjects.length === 0 && (
                            <li className="text-emerald-700">
                                Aktuálne nevidíme projekt, ktorý by nestíhal do
                                termínu.
                            </li>
                        )}

                        {riskyProjects.map((project) => {
                            const missingHours = Math.max(
                                0,
                                Math.round(
                                    project.remaining_hours -
                                        project.available_hours_next_4_weeks,
                                ),
                            );
                            const coverage = Math.min(
                                100,
                                project.remaining_hours > 0
                                    ? Math.round(
                                          (project.available_hours_next_4_weeks /
                                              project.remaining_hours) *
                                              100,
                                      )
                                    : 100,
                            );

                            return (
                                <li
                                    key={project.id}
                                    className="flex items-start justify-between gap-3 rounded-md"
                                >
                                    <div>
                                        <span className="font-medium text-gray-900">
                                            {project.name}
                                        </span>
                                        <span className="text-gray-600">
                                            {' '}
                                            — chýba {missingHours}h, zostáva{' '}
                                            {project.remaining_hours}h
                                            {project.is_overdue
                                                ? ', po termíne'
                                                : `, ${project.days_remaining}d do termínu`}
                                        </span>
                                    </div>
                                    <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                        {coverage}%
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </RecommendationCard>

                <RecommendationCard
                    title="Voľná kapacita"
                    description="Koho sa oplatí zvážiť pre novú prácu."
                    count={freePeople.length}
                    accentClassName="bg-emerald-50 text-emerald-600"
                    icon={Users}
                    open={expandedRecommendations.free}
                    onToggle={() => onToggleRecommendation('free')}
                >
                    <ul className="space-y-1 text-sm text-gray-700">
                        {freePeople.length === 0 && (
                            <li>Aktuálne nie je voľná kapacita.</li>
                        )}

                        {freePeople.map((person) => (
                            <li key={person.id}>
                                <span className="font-medium text-gray-900">
                                    {person.name}
                                </span>{' '}
                                — voľných{' '}
                                {person.free_capacity_hours}h
                            </li>
                        ))}
                    </ul>
                </RecommendationCard>
            </div>
        </section>
    );
}
