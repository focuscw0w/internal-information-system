export const getCapacityColor = (capacityUsed: number): string => {
    if (capacityUsed > 80) return 'bg-red-500';
    if (capacityUsed > 60) return 'bg-yellow-500';
    return 'bg-green-500';
};

export const getAllocationColor = (allocation: number): string => {
    if (allocation > 100) return 'text-red-600';
    if (allocation > 80) return 'text-orange-600';
    return 'text-green-600';
};
