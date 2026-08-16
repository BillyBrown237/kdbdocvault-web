import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'

import {
  createDepartment,
  deleteDepartment,
  departmentsQuery,
  updateDepartment,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import type { Department } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

const ROOT = '__root__'

/**
 * W27 (B55) — departments, finally editable.
 *
 * Rendered as an indented tree from the flat list: the parent relationship is
 * the whole point of the feature, and a flat list of names hides it. Depth is
 * computed by walking parents, so a cycle (which the API now refuses to
 * create) can't hang the render.
 *
 * Delete failures carry the server's own message — "3 members belong to it"
 * tells the admin what to do; "couldn't delete" doesn't.
 */
export function DepartmentsCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const departments = useQuery(departmentsQuery)

  const [name, setName] = useState('')
  const [parent, setParent] = useState<string>(ROOT)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editParent, setEditParent] = useState<string>(ROOT)

  const rows = departments.data?.data ?? []
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }

  const create = useMutation({
    mutationFn: () =>
      createDepartment({
        name: name.trim(),
        ...(parent === ROOT ? {} : { parent_id: parent }),
      }),
    onSuccess: async () => {
      setName('')
      setParent(ROOT)
      toast.success(t('departments.created'))
      await invalidate()
    },
    onError: fail,
  })

  const save = useMutation({
    mutationFn: (id: string) =>
      updateDepartment(id, {
        name: editName.trim(),
        parent_id: editParent === ROOT ? null : editParent,
      }),
    onSuccess: async () => {
      setEditing(null)
      toast.success(t('departments.updated'))
      await invalidate()
    },
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      toast.success(t('departments.deleted'))
      await invalidate()
    },
    onError: fail,
  })

  // Depth by walking up, capped — defensive against a malformed chain rather
  // than trusting the data to be a tree.
  const depthOf = (d: Department): number => {
    let depth = 0
    let current = d
    while (current.parent_id && depth < 10) {
      const parentRow = rows.find((r) => r.id === current.parent_id)
      if (!parentRow) break
      current = parentRow
      depth++
    }
    return depth
  }

  const sorted = [...rows].sort((a, b) => {
    const pathOf = (d: Department): string => {
      const parentRow = rows.find((r) => r.id === d.parent_id)
      return parentRow ? `${pathOf(parentRow)}/${d.name}` : d.name
    }
    return pathOf(a).localeCompare(pathOf(b))
  })

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {t('departments.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('departments.explainer')}</p>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('departments.empty')}</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((d) =>
              editing === d.id ? (
                <div key={d.id} className="space-y-2 rounded-md border p-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Select value={editParent} onValueChange={setEditParent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ROOT}>{t('departments.topLevel')}</SelectItem>
                      {rows
                        .filter((r) => r.id !== d.id)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={save.isPending || !editName.trim()}
                      onClick={() => save.mutate(d.id)}
                    >
                      {t('common.done')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2"
                  style={{ paddingLeft: `${depthOf(d) * 16}px` }}
                >
                  <span className="truncate text-sm">{d.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(d.id)
                        setEditName(d.name)
                        setEditParent(d.parent_id ?? ROOT)
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(d.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <Separator />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) create.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('departments.name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('departments.parent')}</Label>
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT}>{t('departments.topLevel')}</SelectItem>
                {rows.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={create.isPending || !name.trim()}>
            {create.isPending ? t('app.loading') : t('common.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
