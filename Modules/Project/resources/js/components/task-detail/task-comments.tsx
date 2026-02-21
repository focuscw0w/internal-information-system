import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from '@inertiajs/react';
import { MessageSquare, Send } from 'lucide-react';
import { Task } from '../../types/types';

interface TaskCommentsProps {
    task: Task;
}

export const TaskComments = ({ task }: TaskCommentsProps) => {
    const comments = task.comments ?? [];

    const { data, setData, post, processing, reset } = useForm({
        body: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        post(`/projects/${task.project_id}/tasks/${task.id}/comments`, {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Komentáre
                    {comments.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                            ({comments.length})
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Comment form */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <textarea
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        placeholder="Napíšte komentár..."
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button
                        type="submit"
                        disabled={processing || !data.body.trim()}
                        size="sm"
                        className="self-end"
                    >
                        <Send className="mr-1 h-4 w-4" />
                        Odoslať
                    </Button>
                </form>

                {/* Comments list */}
                {comments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">
                        Zatiaľ žiadne komentáre.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex gap-3"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                                    {comment.user?.name
                                        ?.split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase() ?? '?'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {comment.user?.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(
                                                comment.created_at,
                                            ).toLocaleDateString('sk-SK', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {comment.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
