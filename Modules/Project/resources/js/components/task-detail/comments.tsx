import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, usePage } from '@inertiajs/react';
import { MessageSquare, Send } from 'lucide-react';
import { Task } from '../../types/types';
import { SharedData } from '@/types';

interface TaskCommentsProps {
    task: Task;
}

export const Comments = ({ task }: TaskCommentsProps) => {
    const comments = task.comments ?? [];
    const currentUser = usePage<SharedData>().props.auth.user;

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
                    <div className="space-y-5">
                        {comments.map((comment) => {
                            const isOwn = comment.user?.id === currentUser?.id;

                            return (
                                <div
                                    key={comment.id}
                                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                                >
                                    <div
                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                                            isOwn
                                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                        }`}
                                    >
                                        {comment.user?.name
                                            ?.split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase() ?? '?'}
                                    </div>
                                    <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                                        <div
                                            className={`flex items-center gap-2 ${
                                                isOwn ? 'justify-end' : ''
                                            }`}
                                        >
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
                                        <div
                                            className={`mt-1 inline-block rounded-lg px-3 py-2 text-sm ${
                                                isOwn
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {comment.body}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
