import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import type { CapacityPrediction } from '../../types/capacity';

type PredictionSectionProps = {
    prediction: CapacityPrediction;
};

export function PredictionSection({ prediction }: PredictionSectionProps) {
    return (
        <section>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        Predikcia dokončenia projektu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">
                        Zostávajúca práca:{' '}
                        <span className="font-medium">
                            {prediction.remaining_project_hours}h
                        </span>
                        . Dostupná kapacita najbližšie 4 týždne:{' '}
                        <span className="font-medium">
                            {prediction.available_hours_next_4_weeks}h
                        </span>
                        .
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                        <p
                            className={`text-sm font-medium ${prediction.can_finish ? 'text-emerald-700' : 'text-red-700'}`}
                        >
                            {prediction.can_finish
                                ? 'Tím pravdepodobne stihne projekt.'
                                : 'Riziko nestihnutia projektu pri aktuálnej kapacite.'}
                        </p>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            Istota: {prediction.confidence}%
                        </span>
                    </div>

                    {prediction.projects.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                                Rozpad po projektoch
                            </p>

                            {prediction.projects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <span className="font-medium">
                                            {project.name}
                                        </span>
                                        {project.is_overdue ? (
                                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                                                Po termíne
                                            </span>
                                        ) : (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {project.days_remaining}d
                                                zostáva
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">
                                                {project.remaining_hours}h
                                                zostatok
                                            </span>
                                            <span
                                                className={`rounded px-1.5 py-0.5 font-medium ${project.can_finish ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {project.confidence}%
                                            </span>
                                        </div>

                                        <Button variant="default">
                                            <Link
                                                href={`/capacity-management/simulation/project/${project.id}`}
                                            >
                                                Simulovať →
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
