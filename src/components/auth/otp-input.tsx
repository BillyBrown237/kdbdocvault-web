import { useRef } from 'react'

/**
 * Six-box OTP input (W23). Auto-advance, backspace-to-previous, paste
 * distributes digits, WebOTP/keychain autofill via `one-time-code` on the
 * first box. Error styling is calm — a red border, no shaking.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus = false,
  error = false,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  length?: number
  autoFocus?: boolean
  error?: boolean
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function commit(next: string) {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  function setAt(i: number, ch: string) {
    const chars = value.padEnd(length, ' ').split('')
    chars[i] = ch
    commit(chars.join('').trimEnd())
    if (ch && i < length - 1) refs.current[i + 1]?.focus()
  }

  return (
    <div className="flex gap-2" role="group">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          value={value[i] ?? ''}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            // Autofill/paste may land the whole code in one box.
            if (v.length > 1) commit(v)
            else setAt(i, v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            commit(e.clipboardData.getData('text'))
          }}
          className={`h-12 w-10 rounded-md border bg-white text-center font-mono text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            error ? 'border-red-400' : 'border-input'
          }`}
        />
      ))}
    </div>
  )
}
