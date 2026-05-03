import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useForm } from '@inertiajs/react';
import { Paperclip, Send, X } from 'lucide-react';
import {
    ChangeEvent,
    FormEvent,
    KeyboardEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

interface CommentFormProps {
    projectId: number;
    taskId: number;
}

interface MentionUser {
    id: number;
    name: string;
    email: string;
    handle: string;
}

interface CommentFormData {
    body: string;
    attachments: File[];
}

export function CommentForm({ projectId, taskId }: CommentFormProps) {
    const { data, setData, post, processing, reset, progress } =
        useForm<CommentFormData>({
            body: '',
            attachments: [],
        });

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const debouncedMentionQuery = useDebouncedValue(mentionQuery, 200);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (debouncedMentionQuery === null) {
            setMentionUsers([]);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const url = `/projects/${projectId}/comments/mention-lookup?q=${encodeURIComponent(debouncedMentionQuery)}`;
        fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
            credentials: 'same-origin',
        })
            .then((r) => (r.ok ? r.json() : { users: [] }))
            .then((d: { users: MentionUser[] }) => {
                setMentionUsers(d.users ?? []);
                setMentionIndex(0);
            })
            .catch(() => {
                /* aborted or error — ignore */
            });

        return () => controller.abort();
    }, [debouncedMentionQuery, projectId]);

    const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setData('body', value);

        const cursor = e.target.selectionStart ?? value.length;
        const upToCursor = value.slice(0, cursor);
        const match = /(?:^|\s)@([a-zA-Z0-9._-]*)$/.exec(upToCursor);

        if (match) {
            setMentionStart(cursor - match[1].length - 1);
            setMentionQuery(match[1]);
        } else {
            setMentionStart(null);
            setMentionQuery(null);
        }
    };

    const insertMention = (user: MentionUser) => {
        if (mentionStart === null || !textareaRef.current) return;
        const cursor = textareaRef.current.selectionStart ?? data.body.length;
        const before = data.body.slice(0, mentionStart);
        const after = data.body.slice(cursor);
        const handle = user.handle ?? '';
        const newBody = `${before}@${handle} ${after}`;
        setData('body', newBody);
        setMentionQuery(null);
        setMentionStart(null);

        requestAnimationFrame(() => {
            const textarea = textareaRef.current;
            if (textarea) {
                const pos = before.length + handle.length + 2;
                textarea.focus();
                textarea.setSelectionRange(pos, pos);
            }
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionUsers.length === 0 || mentionQuery === null) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionIndex((i) => (i + 1) % mentionUsers.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionIndex(
                (i) => (i - 1 + mentionUsers.length) % mentionUsers.length,
            );
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const user = mentionUsers[mentionIndex];
            if (user) insertMention(user);
        } else if (e.key === 'Escape') {
            setMentionQuery(null);
        }
    };

    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const merged = [...data.attachments, ...files].slice(0, 5);
        setData('attachments', merged);
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        const next = data.attachments.filter((_, i) => i !== index);
        setData('attachments', next);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        post(`/projects/${projectId}/tasks/${taskId}/comments`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('body', 'attachments');
                setMentionQuery(null);
            },
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-2 border-t border-border pt-4"
        >
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={data.body}
                    onChange={handleBodyChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Napíšte komentár... (použite @ na označenie kolegu)"
                    rows={3}
                    className="textarea w-full resize-none"
                />

                {mentionQuery !== null && mentionUsers.length > 0 && (
                    <div className="absolute z-30 mt-1 max-h-56 w-72 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                        {mentionUsers.map((u, idx) => (
                            <button
                                type="button"
                                key={u.id}
                                onMouseEnter={() => setMentionIndex(idx)}
                                onClick={() => insertMention(u)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                                    idx === mentionIndex
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-foreground hover:bg-muted'
                                }`}
                            >
                                <span className="font-medium">{u.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    @{u.handle}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {data.attachments.length > 0 && (
                <ul className="space-y-1">
                    {data.attachments.map((file, idx) => (
                        <li
                            key={`${file.name}-${idx}`}
                            className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                        >
                            <span className="truncate">
                                {file.name}{' '}
                                <span className="text-muted-foreground">
                                    ({Math.round(file.size / 1024)} KB)
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="ml-2 text-muted-foreground hover:text-[var(--danger-text)]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex items-center justify-between">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={data.attachments.length >= 5}
                >
                    <Paperclip className="mr-1 h-4 w-4" />
                    Príloha{' '}
                    {data.attachments.length > 0 &&
                        `(${data.attachments.length}/5)`}
                </Button>

                <Button
                    type="submit"
                    disabled={processing || !data.body.trim()}
                    size="sm"
                >
                    <Send className="mr-1 h-4 w-4" />
                    {progress ? `${progress.percentage}%` : 'Odoslať'}
                </Button>
            </div>
        </form>
    );
}
