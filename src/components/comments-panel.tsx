import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'

import {
  commentsQuery,
  createComment,
  deleteComment,
  editComment,
  meQuery,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import type { Comment } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'

/** Comments are editable for 15 minutes (B63) — the button disappears rather
 * than waiting to fail with a 409. */
const EDIT_WINDOW_MS = 15 * 60 * 1000

/**
 * W31 (B63) — the conversation about a document that isn't a workflow.
 *
 * The API returns a flat array with `parent_id`; nesting happens here, one
 * level deep. Deleted comments arrive as tombstones with an empty body and
 * stay in place, because replies underneath a vanished comment stop making
 * sense — and a thread with holes in it reads as a cover-up.
 */
export function CommentsPanel({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const comments = useQuery(commentsQuery(documentId))
  const me = useQuery(meQuery)

  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  const fail = (e: unknown) => {
    if (e instanceof NetworkError) toast.error(t('errors.network'))
    else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['comments', documentId] })

  const post = useMutation({
    mutationFn: (input: { body: string; parent_id?: string | null }) =>
      createComment(documentId, input),
    onSuccess: async () => {
      setBody('')
      setReplyBody('')
      setReplyTo(null)
      await invalidate()
    },
    onError: fail,
  })

  const edit = useMutation({
    mutationFn: (id: string) => editComment(id, editBody.trim()),
    onSuccess: async () => {
      setEditing(null)
      await invalidate()
    },
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: invalidate,
    onError: fail,
  })

  // Flat → one level. Roots keep API order; replies hang off their parent.
  const threads = useMemo(() => {
    const all = comments.data?.data ?? []
    const roots = all.filter((c) => !c.parent_id)
    const byParent = new Map<string, Comment[]>()
    for (const c of all) {
      if (!c.parent_id) continue
      const list = byParent.get(c.parent_id) ?? []
      list.push(c)
      byParent.set(c.parent_id, list)
    }
    return roots.map((r) => ({ root: r, replies: byParent.get(r.id) ?? [] }))
  }, [comments.data])

  const canEdit = (c: Comment) =>
    !c.deleted &&
    c.author_id === me.data?.id &&
    Date.now() - new Date(c.created_at).getTime() < EDIT_WINDOW_MS

  const renderOne = (c: Comment, isReply: boolean) => (
    <div key={c.id} className={isReply ? 'ml-6 border-l pl-3' : ''}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium">{c.author_name}</span>
        <span className="text-xs text-muted-foreground">
          {formatDate(c.created_at, i18n.language)}
        </span>
        {c.edited && !c.deleted && (
          <span className="text-xs text-muted-foreground">{t('comments.edited')}</span>
        )}
      </div>

      {c.deleted ? (
        <p className="text-sm italic text-muted-foreground">{t('comments.deleted')}</p>
      ) : editing === c.id ? (
        <div className="mt-1 space-y-2">
          <Textarea rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={edit.isPending || !editBody.trim()}
              onClick={() => edit.mutate(c.id)}
            >
              {t('common.done')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm">{c.body}</p>
      )}

      {!c.deleted && editing !== c.id && (
        <div className="mt-0.5 flex gap-1">
          {!isReply && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setReplyTo(replyTo === c.id ? null : c.id)
                setReplyBody('')
              }}
            >
              {t('comments.reply')}
            </Button>
          )}
          {canEdit(c) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setEditing(c.id)
                setEditBody(c.body)
              }}
            >
              {t('common.edit')}
            </Button>
          )}
          {c.author_id === me.data?.id && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-red-600 hover:text-red-600"
              disabled={remove.isPending}
              onClick={() => remove.mutate(c.id)}
            >
              {t('common.delete')}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          {t('comments.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {threads.length === 0 && !comments.isPending && (
          <p className="text-sm text-muted-foreground">{t('comments.empty')}</p>
        )}

        {threads.map(({ root, replies }) => (
          <div key={root.id} className="space-y-2">
            {renderOne(root, false)}
            {replies.map((r) => renderOne(r, true))}
            {replyTo === root.id && (
              <div className="ml-6 space-y-2 border-l pl-3">
                <Textarea
                  rows={2}
                  autoFocus
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={t('comments.placeholder')}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={post.isPending || !replyBody.trim()}
                    onClick={() => post.mutate({ body: replyBody.trim(), parent_id: root.id })}
                  >
                    {t('comments.send')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="space-y-2 border-t pt-3">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('comments.placeholder')}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t('comments.mentionHint')}</p>
            <Button
              size="sm"
              disabled={post.isPending || !body.trim()}
              onClick={() => post.mutate({ body: body.trim() })}
            >
              {t('comments.send')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
