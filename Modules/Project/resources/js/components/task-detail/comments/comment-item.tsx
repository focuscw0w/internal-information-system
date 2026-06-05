import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getAvatarColor } from '@/lib/avatar-color';
import { FileText } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Comment, CommentAttachment } from '../../../types/types';

interface CommentItemProps {
    comment: Comment;
    isOwn: boolean;
}

const MENTION_SPLIT_REGEX = /(@[a-zA-Z0-9._-]+)/g;
const MENTION_TEST_REGEX = /^@[a-zA-Z0-9._-]+$/;

function renderMentions(body: string): React.ReactNode[] {
    const parts = body.split(MENTION_SPLIT_REGEX);
    return parts.map((part, idx) =>
        MENTION_TEST_REGEX.test(part) ? (
            <span key={idx} className="rounded bg-blue-50 px-1 text-blue-700">
                {part}
            </span>
        ) : (
            <Fragment key={idx}>{part}</Fragment>
        ),
    );
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommentItem({ comment, isOwn }: CommentItemProps) {
    const [lightbox, setLightbox] = useState<CommentAttachment | null>(null);
    const attachments = comment.attachments ?? [];

    const initials =
        comment.user?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() ?? '?';

    return (
        <div className="flex gap-3">
            <div
                className={`avatar ${isOwn ? 'bg-[var(--success)] text-white' : getAvatarColor(comment.user?.name)}`}
            >
                {initials}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                        {comment.user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString(
                            'sk-SK',
                            {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            },
                        )}
                    </span>
                </div>

                <div className="mt-1 max-w-full text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                    {renderMentions(comment.body)}
                </div>

                {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {attachments.map((att) =>
                            att.is_image && att.download_url ? (
                                <button
                                    type="button"
                                    key={att.id}
                                    onClick={() => setLightbox(att)}
                                    className="overflow-hidden rounded-md border border-border hover:border-ring"
                                >
                                    <img
                                        src={att.download_url}
                                        alt={att.original_name}
                                        className="h-24 w-24 object-cover"
                                    />
                                </button>
                            ) : (
                                <a
                                    key={att.id}
                                    href={att.download_url ?? '#'}
                                    className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground hover:border-ring"
                                >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="max-w-[12rem] truncate">
                                        {att.original_name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatSize(att.size_bytes)}
                                    </span>
                                </a>
                            ),
                        )}
                    </div>
                )}
            </div>

            <Dialog
                open={lightbox !== null}
                onOpenChange={(open) => !open && setLightbox(null)}
            >
                <DialogContent className="max-w-3xl p-2">
                    <DialogTitle className="sr-only">
                        {lightbox?.original_name ?? 'Príloha'}
                    </DialogTitle>
                    {lightbox?.download_url && (
                        <img
                            src={lightbox.download_url}
                            alt={lightbox.original_name}
                            className="max-h-[80vh] w-full object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
