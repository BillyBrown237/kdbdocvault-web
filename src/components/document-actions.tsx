import { useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderInput, Plus, Trash2 } from 'lucide-react'

import {
  createTag,
  moveDocument,
  rootFoldersQuery,
  setDocumentTags,
  tagsQuery,
  trashDocument,
} from '@/lib/api/queries'
import type { Document } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
      </CardContent>
    </Card>
  )
}
