import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { deleteFolder, moveFolder, renameFolder, rootFoldersQuery } from '@/lib/api/queries'
import type { Folder } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'

const ROOT = '__root__'

/**
 * W24 (B48): folder rename / move / delete. Delete warns that the whole
 * subtree goes to trash and surfaces the 423 refusal verbatim when a held
 * document blocks it — that message is legal information, not noise.
 */
export function FolderActions({ folder }: { folder: Folder }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const roots = useInfiniteQuery(rootFoldersQuery)

  const [dialog, setDialog] = useState<'rename' | 'move' | 'delete' | null>(null)
  const [name, setName] = useState(folder.name)
  const [parent, setParent] = useState<string>(ROOT)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] })
    await queryClient.invalidateQueries({ queryKey: ['documents'] })
  }
  const fail = (err: unknown) =>
    toast.error(
      err instanceof NetworkError
        ? t('errors.network')
        : err instanceof ApiProblem
          ? (err.detail ?? err.title)
          : t('errors.unknown'),
    )

  const rename = useMutation({
    mutationFn: () => renameFolder(folder.id, name.trim()),
    onSuccess: async () => {
      toast.success(t('vault.folderRenamed'))
      setDialog(null)
      await invalidate()
    },
    onError: fail,
  })
  const move = useMutation({
    mutationFn: () => moveFolder(folder.id, parent === ROOT ? null : parent),
    onSuccess: async () => {
      toast.success(t('vault.folderMoved'))
      setDialog(null)
      await invalidate()
    },
    onError: fail,
  })
  const remove = useMutation({
    mutationFn: () => deleteFolder(folder.id),
    onSuccess: async () => {
      toast.success(t('vault.folderDeleted'))
      setDialog(null)
      await invalidate()
    },
    onError: fail,
  })

  const rootOptions = (roots.data?.pages.flatMap((p) => p.data) ?? []).filter(
    (f) => f.id !== folder.id,
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 shrink-0 p-0"
            aria-label={t('vault.folderActions')}
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
          <DropdownMenuItem
            onClick={() => {
              setName(folder.name)
              setDialog('rename')
            }}
          >
            {t('vault.renameFolder')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog('move')}>
            {t('vault.moveFolder')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setDialog('delete')}
          >
            {t('vault.deleteFolder')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          {dialog === 'rename' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('vault.renameFolder')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="folder-name">{t('vault.folderName')}</Label>
                <Input
                  id="folder-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  disabled={rename.isPending || !name.trim() || name.trim() === folder.name}
                  onClick={() => rename.mutate()}
                >
                  {rename.isPending ? t('app.loading') : t('common.done')}
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog === 'move' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('vault.moveFolder')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label>{t('vault.moveTarget')}</Label>
                <Select value={parent} onValueChange={setParent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT}>{t('vault.title')}</SelectItem>
                    {rootOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  {t('common.cancel')}
                </Button>
                <Button disabled={move.isPending} onClick={() => move.mutate()}>
                  {move.isPending ? t('app.loading') : t('common.done')}
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('vault.deleteFolder')}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {t('vault.deleteFolderWarning', { name: folder.name })}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  {remove.isPending ? t('app.loading') : t('vault.deleteFolderConfirm')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
