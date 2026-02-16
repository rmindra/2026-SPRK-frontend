const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  // Backend stores UTC; show consistently as WIB (Asia/Jakarta) in UI.
  timeZone: 'Asia/Jakarta',
})

export function formatDateTime(iso: string): string {
  try {
    return dateTimeFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

