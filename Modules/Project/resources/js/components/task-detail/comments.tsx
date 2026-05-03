import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
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
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Komentáre</h3>
                {comments.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {comments.length} komentárov
                    </span>
                )}
            </div>
            <div className="card__body space-y-5">
                {comments.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                        Zatiaľ žiadne komentáre.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                isOwn={comment.user?.id === currentUser?.id}
                            />
                        ))}
                    </div>
                )}
                <CommentForm projectId={task.project_id} taskId={task.id} />
            </div>
        </section>
    );
};
