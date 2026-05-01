import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { Task } from '../../types/types';
import { CommentForm } from './comments/comment-form';
import { CommentItem } from './comments/comment-item';

interface TaskCommentsProps {
    task: Task;
}

export const Comments = ({ task }: TaskCommentsProps) => {
    const comments = task.comments ?? [];
    const currentUser = usePage<SharedData>().props.auth.user;

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
                <CommentForm projectId={task.project_id} taskId={task.id} />

                {comments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">
                        Zatiaľ žiadne komentáre.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                isOwn={comment.user?.id === currentUser?.id}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
