/** Injected once: holds the current `@page` rule (A4/A5 landscape). */
let pageRule: HTMLStyleElement | null = null

/**
 * Print the planner to PDF: sets the paper size (A4/A5 landscape) and
 * opens the browser print dialog, where "Save as PDF" is available.
 */
export function printPlanner(paper: 'A4' | 'A5'): void {
  if (!pageRule) {
    pageRule = document.createElement('style')
    document.head.appendChild(pageRule)
  }
  pageRule.textContent = `@page { size: ${paper} landscape; margin: 6mm; }`
  document.body.dataset.paper = paper
  window.print()
}
