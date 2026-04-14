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
import { UtilizationBar } from '../shared/utilization';

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
            <Card className="gap-0">
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between px-6 py-5 text-left">
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
                <CollapsibleContent className="border-t">
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
                <p className="mt-1 text-sm text-gray-500">
                    Hlavný blok ostáva stručný a detail si rozbalíš len tam, kde
                    chceš riešiť problém.
                </p>
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
                    <div className="space-y-3">
                        {overloadedPeople.length === 0 && (
                            <div className="rounded-md text-sm text-emerald-700">
                                Nikto nie je nad 100 % kapacity.
                            </div>
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
                                <Card
                                    key={person.id}
                                    className="gap-3 border-red-100 bg-red-50/60 p-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-gray-900">
                                            {person.name}
                                        </span>
                                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                            {person.weekly_utilization}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Je približne o{' '}
                                        <span className="font-medium">
                                            {overloadHours}h/týždeň
                                        </span>{' '}
                                        nad kapacitou.
                                    </p>
                                    <UtilizationBar
                                        utilization={person.weekly_utilization}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Vhodný zásah: odobrať časť práce,
                                        presunúť úlohy alebo pridať ďalšieho
                                        človeka na projekt.
                                    </p>
                                </Card>
                            );
                        })}
                    </div>
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
                    <div className="space-y-3">
                        {riskyProjects.length === 0 && (
                            <div className="rounded-md text-sm text-emerald-700">
                                Aktuálne nevidíme projekt, ktorý by nestíhal do
                                termínu.
                            </div>
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
                                <Card
                                    key={project.id}
                                    className="gap-3 border-orange-100 bg-orange-50/60 p-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-gray-900">
                                            {project.name}
                                        </span>
                                        <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                            chýba {missingHours}h
                                        </span>
                                    </div>
                                    <div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-orange-500"
                                                style={{
                                                    width: `${coverage}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {
                                                    project.available_hours_next_4_weeks
                                                }
                                                h dostupných
                                            </span>
                                            <span>
                                                {project.remaining_hours}h
                                                zostáva
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Vhodný zásah: pridať kapacitu, odľahčiť
                                        tím alebo posunúť termín projektu.
                                    </p>
                                </Card>
                            );
                        })}
                    </div>
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
                                {person.name} — voľných{' '}
                                {person.free_capacity_hours}h
                            </li>
                        ))}
                    </ul>
                </RecommendationCard>
            </div>
        </section>
    );
}
