import { Head } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";

export default function Index({ title }: { title: string }) {
  return (
    <AppLayout>
      <Head title={title} />
      <div className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toto je automaticky vytvorená stránka modulu.
        </p>
      </div>
    </AppLayout>
  );
}