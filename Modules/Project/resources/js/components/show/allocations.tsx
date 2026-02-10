import { Project } from "../../types/project.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface AllocationsProps {
    project: Project;
}

export const Allocations = ({project}: AllocationsProps) => {
    return (
        <>
            {project.allocations && project.allocations.length > 0 && (
                    <Card className="border-gray-100 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Users className="mr-2 h-5 w-5 text-gray-700" />
                                Tím ({project.allocations.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {project.allocations.map((allocation) => {
                                    const allocationProgress =
                                        allocation.allocated_hours > 0
                                            ? (allocation.used_hours /
                                                  allocation.allocated_hours) *
                                              100
                                            : 0;

                                    return (
                                        <div
                                            key={allocation.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                                        >
                                            <div className="flex-1">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {
                                                                allocation.user
                                                                    .name
                                                            }
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {
                                                                allocation.percentage
                                                            }
                                                            % alokácia
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">
                                                            {
                                                                allocation.used_hours
                                                            }
                                                            h /{' '}
                                                            {
                                                                allocation.allocated_hours
                                                            }
                                                            h
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(
                                                                allocation.start_date,
                                                            ).toLocaleDateString(
                                                                'sk-SK',
                                                            )}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                allocation.end_date,
                                                            ).toLocaleDateString(
                                                                'sk-SK',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Progress
                                                    value={allocationProgress}
                                                    className="h-2 bg-gray-200"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </>
        )
};