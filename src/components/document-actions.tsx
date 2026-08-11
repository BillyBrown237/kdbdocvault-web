import { useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderInput, Gavel, Pencil, Plus, Trash2 } from 'lucide-react'

import {
  addHoldItems,
  createTag,
  documentTypesQuery,
  getDocumentWithEtag,
  legalHoldsQuery,
  meQuery,
  moveDocument,
  patchDocument,
  rootFoldersQuery,
  setDocumentTags,
  tagsQuery,
  tenantQuery,
  trashDocument,
} from '@/lib/api/queries'
import type { Document } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

/** Tag chips + move + trash for the document detail page. */
export function DocumentActions({ document }: { document: Document }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const allTags = useQuery(tagsQuery)
  const folders = useInfiniteQuery(rootFoldersQuery)
  const [newTag, setNewTag] = useState('')

  // W24 (B48): edit title/type through PATCH + If-Match. The ETag is fetched
  // FRESH when the dialog opens — echo server state, never compute it.
  const docTypes = useQuery(documentTypesQuery)
  const [editOpen, setEditOpen] = useState(false)
  const [editEtag, setEditEtag] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState(document.title)
  const [editType, setEditType] = useState<string>(document.type_id ?? '__none__')

  async function openEdit() {
    try {
      const { data, etag } = await getDocumentWithEtag(document.id)
      setEditTitle(data.title)
      setEditType(data.type_id ?? '__none__')
      setEditEtag(etag)
      setEditOpen(true)
    } catch {
      toast.error(t('errors.unknown'))
    }
  }

  const editMutation = useMutation({
    mutationFn: () =>
      patchDocument(document.id, editEtag ?? '*', {
        title: editTitle.trim(),
        type_id: editType === '__none__' ? null : editType,
      }),
    onSuccess: async () => {
      toast.success(t('document.updated'))
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err) =>
      toast.error(err instanceof Error && 'status' in err && (err as { status: number }).status === 409
        ? t('document.editConflict')
        : t('errors.unknown')),
  })

  // W24 (B50): place under legal hold — admin only.
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)
  const role = me.data?.memberships.find((m) => m.tenant_id === tenant.data?.id)?.role
  const isAdmin = role === 'Owner' || role === 'Admin'
  const holds = useQuery({ ...legalHoldsQuery, enabled: isAdmin })
  const [holdOpen, setHoldOpen] = useState(false)
  const [holdId, setHoldId] = useState<string>('')

  const holdMutation = useMutation({
    mutationFn: () => addHoldItems(holdId, [document.id]),
    onSuccess: async () => {
      toast.success(t('holds.attached'))
      setHoldOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['documents', 'detail', document.id] })
      await queryClient.invalidateQueries({ queryKey: ['legal-holds'] })
    },
    onError: () => toast.error(t('errors.unknown')),
  })
  const activeHolds = (holds.data?.data ?? []).filter((h) => h.status === 'active')

  const currentTagIds = new Set((document.tags ?? []).map((x) => x.id))

  const invalidateDoc = async () => {
    await queryClient.invalidateQueries({ queryKey: ['documents'] })
    await queryClient.invalidateQueries({ queryKey: ['tags'] })
  }

  const tagMutation = useMutation({
    mutationFn: (tagIds: string[]) => setDocumentTags(document.id, tagIds),
    onSuccess: invalidateDoc,
  })

  const addTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const tag = await createTag(name)
      await setDocumentTags(document.id, [...currentTagIds, tag.id])
    },
    onSuccess: async () => {
      setNewTag('')
      await invalidateDoc()
    },
  })

  const moveMutation = useMutation({
    mutationFn: (folderId: string | null) => moveDocument(document.id, folderId),
    onSuccess: async () => {
      toast.success(t('document.moved'))
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const trashMutation = useMutation({
    mutationFn: () => trashDocument(document.id),
    onSuccess: async () => {
      toast.success(t('document.trashed'))
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['folders'] })
      await queryClient.invalidateQueries({ queryKey: ['trash'] })
      await navigate({ to: '/vault' })
    },
  })

  function toggleTag(tagId: string) {
    const next = new Set(currentTagIds)
    if (next.has(tagId)) next.delete(tagId)
    else next.add(tagId)
    tagMutation.mutate([...next])
  }

  const rootFolders = folders.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('document.organize')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {allTags.data?.data.map((tag) => {
            const active = currentTagIds.has(tag.id)
            return (
              <button key={tag.id} type="button" disabled={tagMutation.isPending} onClick={() => toggleTag(tag.id)}>
                <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer">
                  {tag.name}
                </Badge>
              </button>
            )
          })}
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              if (newTag.trim()) addTagMutation.mutate(newTag.trim())
            }}
          >
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder={t('document.newTag')}
              className="h-7 w-28 text-xs"
            />
            <Button
              type="submit"
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={addTagMutation.isPending || !newTag.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </form>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <FolderInput className="h-4 w-4 text-muted-foreground" />
            <Select
              onValueChange={(v) => moveMutation.mutate(v === '__root__' ? null : v)}
              disabled={moveMutation.isPending}
            >
              <SelectTrigger className="h-9 w-56">
                <SelectValue placeholder={t('document.moveTarget')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">{t('vault.title')}</SelectItem>
                {rootFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => void openEdit()}>
            <Pencil className="h-4 w-4" />
            {t('document.edit')}
          </Button>
          {isAdmin && activeHolds.length > 0 && !document.legal_hold && (
            <Button variant="outline" onClick={() => setHoldOpen(true)}>
              <Gavel className="h-4 w-4" />
              {t('holds.attach')}
            </Button>
          )}
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-600"
            disabled={trashMutation.isPending}
            onClick={() => trashMutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            {t('document.trash')}
          </Button>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('document.edit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-title">{t('document.titleField')}</Label>
                <Input
                  id="doc-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('document.typeField')}</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('document.noType')}</SelectItem>
                    {docTypes.data?.data.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id}>
                        {dt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                disabled={editMutation.isPending || !editTitle.trim()}
                onClick={() => editMutation.mutate()}
              >
                {editMutation.isPending ? t('app.loading') : t('common.done')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('holds.attach')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t('holds.attachHint')}</p>
            <Select value={holdId} onValueChange={setHoldId}>
              <SelectTrigger>
                <SelectValue placeholder={t('holds.pick')} />
              </SelectTrigger>
              <SelectContent>
                {activeHolds.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHoldOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                disabled={holdMutation.isPending || !holdId}
                onClick={() => holdMutation.mutate()}
              >
                {holdMutation.isPending ? t('app.loading') : t('holds.attachConfirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
