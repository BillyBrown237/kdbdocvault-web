import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { jobQuery } from '@/lib/api/queries'
import type { Job } from '@/lib/api/types'

/**
 * Async jobs (audit exports, evidence bundles) answer 202 with a job id, so
 * the UI polls `GET /audit/exports/{jobId}` until it settles.
 *
 * Polling stops the moment the job is `done` or `failed` — a finished job's
 * row never changes again, and leaving an interval running is how a tab left
 * open overnight quietly hammers the API.
 */
export function useJob() {
  const [jobId, setJobId] = useState<string | null>(null)

  const query = useQuery({
    ...jobQuery(jobId ?? ''),
    enabled: jobId !== null,
    refetchInterval: (q) => {
      const status = (q.state.data as Job | undefined)?.status
      return status === 'done' || status === 'failed' ? false : 2000
    },
  })

  return {
    job: query.data ?? null,
    /** True from submission until the job settles. */
    running: jobId !== null && query.data?.status !== 'done' && query.data?.status !== 'failed',
    start: (job: Job) => setJobId(job.job_id),
    reset: () => setJobId(null),
  }
}
