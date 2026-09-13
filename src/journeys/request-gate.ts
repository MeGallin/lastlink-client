/** New edits/navigation invalidate old work even if a transport ignores abort. */
export function createRequestGate() {
  let revision = 0
  let controller: AbortController | null = null
  return {
    cancel() {
      revision += 1
      controller?.abort()
      controller = null
    },
    begin() {
      controller?.abort()
      controller = new AbortController()
      const ticket = ++revision
      return { signal: controller.signal, isCurrent: () => ticket === revision }
    },
  }
}
