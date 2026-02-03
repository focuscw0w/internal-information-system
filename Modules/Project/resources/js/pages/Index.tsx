import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ProjectsCapacityOverview from '../components/project-overview';

export default function Index({ title }: { title: string }) {
  return (
    <AppLayout>
      <Head title={title} />
      <div className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
      <ProjectsCapacityOverview />
      </div>
    </AppLayout>
  );
}