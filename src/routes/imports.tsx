import { createFileRoute } from '@tanstack/react-router'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Cloud, Download, FileArchive, Folder, Plug, Upload } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  browseConnection,
  cancelImport,
  createImportConnection,
  importConnectionsQuery,
  importQuery,
  importsQuery,
  revokeImportConnection,
  rootFoldersQuery,
  startDriveImport,
  startImport,
} from '@/lib/api/queries'
import { UploadTask } from '@/lib/api/upload'
import type { DriveBrowse, ImportJob } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/imports')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: ImportsPage,
})

const ROOT = '__root__'

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

function ImportsPage() {
  const { t } = useTranslation()
  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <FileArchive className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('imports.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('imports.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="mt-4">
        <TabsList>
          <TabsTrigger value="new">{t('imports.new')}</TabsTrigger>
          <TabsTrigger value="history">{t('imports.history')}</TabsTrigger>
          <TabsTrigger value="sources">{t('imports.sources')}</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-4">
          <NewImportCard />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="sources" className="mt-4">
          <SourcesTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

function NewImportCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const folders = useInfiniteQuery(rootFoldersQuery)
  const connections = useQuery(importConnectionsQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  const [folderId, setFolderId] = useState(ROOT)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [csvEntry, setCsvEntry] = useState('')
  const [titleColumn, setTitleColumn] = useState('title')
  const [pathColumn, setPathColumn] = useState('path')
  const [progress, setProgress] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const drive = connections.data?.data.find(
    (c) => c.provider === 'google_drive' && c.status === 'connected',
  )

  async function onDrivePick(pick: { folderId?: string; fileIds?: string[] }) {
    setPickerOpen(false)
    if (!drive) return
    try {
      const job = await startDriveImport({
        connection_id: drive.id,
        drive_folder_id: pick.folderId,
        drive_file_ids: pick.fileIds,
        target_folder_id: folderId === ROOT ? undefined : folderId,
      })
      setActiveId(job.id)
      toast.success(t('imports.started'))
      await queryClient.invalidateQueries({ queryKey: ['imports'] })
    } catch (err) {
      fail(err, t)
    }
  }

  async function onPick(files: FileList | null) {
    const file = files?.[0]
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error(t('imports.zipOnly'))
      return
    }

    setProgress(0)
    try {
      // Reserve + PUT only. Completing the upload would create ONE document
      // out of the archive; the import worker wants the archive itself.
      const uploadId = await new UploadTask(file).runAsArchive(setProgress)
      const job = await startImport({
        upload_id: uploadId,
        target_folder_id: folderId === ROOT ? undefined : folderId,
        source: csvEntry.trim() ? 'csv' : 'zip',
        mapping: csvEntry.trim()
          ? {
              csv_entry: csvEntry.trim(),
              title_column: titleColumn.trim() || 'title',
              path_column: pathColumn.trim() || 'path',
            }
          : undefined,
      })
      setActiveId(job.id)
      toast.success(t('imports.started'))
      await queryClient.invalidateQueries({ queryKey: ['imports'] })
    } catch (err) {
      fail(err, t)
    } finally {
      setProgress(null)
    }
  }

  const rootFolders = folders.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">{t('imports.new')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('imports.explainer')}</p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('imports.targetFolder')}</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT}>{t('vault.title')}</SelectItem>
                  {rootFolders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => void onPick(e.target.files)}
            />
            <Button disabled={progress !== null} onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {progress !== null ? t('imports.uploading') : t('imports.chooseZip')}
            </Button>
          </div>

          {progress !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}

          <Separator />

          {/* Drive import (W19): visible only with a live connection — a
              button that could only 501 belongs in the Sources tab as a
              sentence, not here. Same target-folder select as ZIP. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {drive
                ? t('imports.driveExplainer', {
                    account: drive.account_label ?? 'Google Drive',
                  })
                : t('imports.driveNotConnected')}
            </p>
            {drive && (
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                <Cloud className="h-4 w-4" />
                {t('imports.driveImport')}
              </Button>
            )}
          </div>

          <Separator />

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              {t('imports.manifestToggle')}
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">{t('imports.manifestHint')}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('imports.csvEntry')}</Label>
                <Input
                  value={csvEntry}
                  onChange={(e) => setCsvEntry(e.target.value)}
                  placeholder="metadata.csv"
                  className="w-48"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('imports.pathColumn')}</Label>
                <Input
                  value={pathColumn}
                  onChange={(e) => setPathColumn(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('imports.titleColumn')}</Label>
                <Input
                  value={titleColumn}
                  onChange={(e) => setTitleColumn(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      {activeId && <ActiveImportCard importId={activeId} />}

      {drive && pickerOpen && (
        <DriveFolderPicker
          connectionId={drive.id}
          onClose={() => setPickerOpen(false)}
          onPick={(pick) => void onDrivePick(pick)}
        />
      )}
    </div>
  )
}

/**
 * Drive picker. Mounted fresh per open, so state starts at the root every
 * time. Owns its paging manually (page_token accumulation) — a picker open
 * for seconds has nothing to gain from the query cache.
 *
 * Two ways out: tick individual files (selection survives navigating between
 * folders) and import exactly those, or import the current folder
 * recursively. Ticking anything switches the footer to the file mode —
 * mixing the two in one job would make "what did I just import?" unanswerable.
 */
function DriveFolderPicker({
  connectionId,
  onClose,
  onPick,
}: {
  connectionId: string
  onClose: () => void
  onPick: (pick: { folderId?: string; fileIds?: string[] }) => void
}) {
  const { t } = useTranslation()
  const [stack, setStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: t('imports.driveRoot') },
  ])
  const [listing, setListing] = useState<DriveBrowse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Map<string, string>>(new Map())
  const current = stack[stack.length - 1]

  function toggle(f: { id: string; name: string }) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(f.id)) next.delete(f.id)
      else next.set(f.id, f.name)
      return next
    })
  }

  async function load(folderId: string, pageToken?: string) {
    setLoading(true)
    try {
      const page = await browseConnection(
        connectionId,
        folderId === 'root' ? undefined : folderId,
        pageToken,
      )
      setListing((prev) =>
        pageToken && prev
          ? {
              ...page,
              folders: [...prev.folders, ...page.folders],
              files: [...prev.files, ...page.files],
            }
          : page,
      )
    } catch (err) {
      fail(err, t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('root')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load on mount only
  }, [])

  function enter(f: { id: string; name: string }) {
    setStack((s) => [...s, f])
    setListing(null)
    void load(f.id)
  }

  function backTo(index: number) {
    const target = stack[index]
    setStack((s) => s.slice(0, index + 1))
    setListing(null)
    void load(target.id)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('imports.drivePickFolder')}</DialogTitle>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {stack.map((s, i) => (
            <span key={`${s.id}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                className={
                  i === stack.length - 1
                    ? 'font-medium'
                    : 'text-muted-foreground underline-offset-2 hover:underline'
                }
                disabled={i === stack.length - 1}
                onClick={() => backTo(i)}
              >
                {s.name}
              </button>
            </span>
          ))}
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {listing === null || (loading && listing === null) ? (
            <Skeleton className="h-24" />
          ) : (
            <>
              {listing.folders.map((f) => (
                <button
                  key={f.id}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => enter(f)}
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
              {listing.files.map((f) => (
                <label
                  key={f.id}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-slate-900"
                    checked={selected.has(f.id)}
                    onChange={() => toggle(f)}
                  />
                  <span className="truncate">{f.name}</span>
                </label>
              ))}
              {listing.folders.length === 0 && listing.files.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  {t('imports.driveEmpty')}
                </p>
              )}
              {listing.next_page_token && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  disabled={loading}
                  onClick={() => void load(current.id, listing.next_page_token!)}
                >
                  {t('common.loadMore')}
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {selected.size > 0 && (
            <Button variant="ghost" onClick={() => setSelected(new Map())}>
              {t('imports.driveClearSelection')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {selected.size > 0 ? (
            <Button onClick={() => onPick({ fileIds: [...selected.keys()] })}>
              {t('imports.driveImportFiles', { count: selected.size })}
            </Button>
          ) : (
            <Button onClick={() => onPick({ folderId: current.id })}>
              {t('imports.driveImportThis', { name: current.name })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Live progress. Polls only while the job is unfinished. */
function ActiveImportCard({ importId }: { importId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const job = useQuery({
    ...importQuery(importId),
    refetchInterval: (q) => {
      const s = (q.state.data as ImportJob | undefined)?.status
      return s === 'done' || s === 'failed' || s === 'cancelled' ? false : 1500
    },
  })

  const cancel = useMutation({
    mutationFn: () => cancelImport(importId),
    onSuccess: async () => {
      toast.success(t('imports.cancelled'))
      await queryClient.invalidateQueries({ queryKey: ['import', importId] })
      await queryClient.invalidateQueries({ queryKey: ['imports'] })
    },
    onError: (e) => fail(e, t),
  })

  if (!job.data) return <Skeleton className="h-28" />
  const j = job.data
  const running = j.status === 'queued' || j.status === 'running'
  const done = j.transferred + j.failed
  const pct = j.discovered > 0 ? Math.round((done / j.discovered) * 100) : 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('imports.progress')}
          <StatusBadge domain="job" status={j.status} />
        </CardTitle>
        {running && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-600"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            {t('imports.cancel')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm">
          {t('imports.counters', {
            transferred: j.transferred,
            discovered: j.discovered,
            failed: j.failed,
          })}
        </p>
        {j.failed > 0 && j.error_report_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={j.error_report_url} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              {t('imports.errorReport')}
            </a>
          </Button>
        )}
        {j.status === 'cancelled' && (
          <p className="text-xs text-muted-foreground">{t('imports.cancelledNote')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function HistoryTab() {
  const { t, i18n } = useTranslation()
  const q = useInfiniteQuery(importsQuery)
  const jobs = q.data?.pages.flatMap((p) => p.data) ?? []

  if (q.isPending) return <Skeleton className="h-40" />
  if (jobs.length === 0) return <EmptyState label={t('imports.noHistory')} />

  return (
    <>
      <Card>
        <CardContent className="space-y-2 p-4">
          {jobs.map((j, i) => (
            <div key={j.id}>
              {i > 0 && <Separator className="mb-2" />}
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <StatusBadge domain="job" status={j.status} />
                  <span className="text-muted-foreground">
                    {j.started_at ? formatDate(j.started_at, i18n.language) : '—'}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span>
                    {t('imports.counters', {
                      transferred: j.transferred,
                      discovered: j.discovered,
                      failed: j.failed,
                    })}
                  </span>
                  {j.error_report_url && (
                    <a
                      href={j.error_report_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline"
                    >
                      {t('imports.errorReport')}
                    </a>
                  )}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <LoadMoreButton
        hasMore={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onClick={() => void q.fetchNextPage()}
      />
    </>
  )
}

/**
 * Connected sources. Google Drive connects for real (W19/B42): the button
 * opens Google's consent screen in a popup; the callback page posts the
 * outcome back and closes itself. OneDrive/Dropbox/SharePoint still answer
 * 501 server-side, so they stay a sentence, not a button.
 */
function SourcesTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const connections = useQuery(importConnectionsQuery)

  // The callback popup's postMessage. Origin-pinned: the popup rides the /pub
  // alias, so a legitimate outcome always arrives from our own origin.
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      const data = e.data as { type?: string; ok?: boolean; reason?: string }
      if (data?.type !== 'kdb:import-connection') return
      await queryClient.invalidateQueries({ queryKey: ['import-connections'] })
      if (data.ok) toast.success(t('imports.driveConnected'))
      else if (data.reason === 'denied') toast.info(t('imports.driveDenied'))
      else toast.error(t('imports.driveFailed'))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [queryClient, t])

  const connect = useMutation({
    mutationFn: () => createImportConnection('google_drive'),
    onSuccess: (r) => {
      // Popup, not navigation: the app keeps running, and the callback page
      // needs an opener to report back to.
      window.open(r.authorize_url, 'kdb-oauth', 'popup,width=480,height=640')
    },
    onError: (e) => fail(e, t),
  })

  const revoke = useMutation({
    mutationFn: revokeImportConnection,
    onSuccess: async () => {
      toast.success(t('imports.disconnected'))
      await queryClient.invalidateQueries({ queryKey: ['import-connections'] })
    },
    onError: (e) => fail(e, t),
  })

  const list = connections.data?.data ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Plug className="h-4 w-4" />
          {t('imports.sources')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('imports.sourcesHint')}</p>
          <Button disabled={connect.isPending} onClick={() => connect.mutate()}>
            <Plug className="h-4 w-4" />
            {t('imports.connectDrive')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('imports.sourcesUnavailable')}</p>
        {list.length > 0 && (
          <ul className="space-y-2 text-sm">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span>
                  {c.provider}
                  {c.account_label && (
                    <span className="ml-1 text-xs text-muted-foreground">{c.account_label}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDate(c.created_at, i18n.language)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge domain="connection" status={c.status} />
                  {c.status !== 'revoked' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(c.id)}
                    >
                      {t('imports.disconnect')}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// W22: job + connection statuses render through the shared StatusBadge.
