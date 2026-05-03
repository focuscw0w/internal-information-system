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
                <CardHeader>
                    <CardTitle className="text-base">
                        Predikcia dokončenia projektu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {prediction.projects.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                                Rozpad po projektoch
                            </p>
                            <p className="text-xs text-gray-500">
                                Percento vyjadruje pokrytie kapacitou v
                                najbližších 4 týždňoch.
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
                                                Pokrytie {project.confidence}%
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
