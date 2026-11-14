/** Injected once: holds the current `@page` rule (A4 landscape). */
let pageRule: HTMLStyleElement | null = null

/**
 * Print the planner to PDF: sets the A4 landscape paper size and opens the
 * browser print dialog, where "Save as PDF" is available.
 */
export function printPlanner(): void {
  if (!pageRule) {
    pageRule = document.createElement('style')
    document.head.appendChild(pageRule)
  }
  pageRule.textContent = '@page { size: A4 landscape; margin: 6mm; }'
  document.body.dataset.paper = 'A4'
  window.print()
}
