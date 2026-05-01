import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
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
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                    isOwn
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}
            >
                {initials}
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
                        {new Date(comment.created_at).toLocaleDateString('sk-SK', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>

                <div
                    className={`mt-1 inline-block max-w-full whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
                        isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                >
                    {renderMentions(comment.body)}
                </div>

                {attachments.length > 0 && (
                    <div
                        className={`mt-2 flex flex-wrap gap-2 ${
                            isOwn ? 'justify-end' : ''
                        }`}
                    >
                        {attachments.map((att) =>
                            att.is_image && att.download_url ? (
                                <button
                                    type="button"
                                    key={att.id}
                                    onClick={() => setLightbox(att)}
                                    className="overflow-hidden rounded border border-gray-200 hover:border-blue-400"
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
                                    className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:border-blue-400 hover:text-blue-700"
                                >
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="max-w-[12rem] truncate">
                                        {att.original_name}
                                    </span>
                                    <span className="text-gray-400">
                                        {formatSize(att.size_bytes)}
                                    </span>
                                </a>
                            ),
                        )}
                    </div>
                )}
            </div>

            <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
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
