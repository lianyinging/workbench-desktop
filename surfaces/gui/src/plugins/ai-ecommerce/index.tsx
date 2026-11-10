/**
 * Local React entry for ai-ecommerce when mode is switched to `plugin`.
 * Current shipping mode is `embed` (see manifest) — this module is the hook
 * for a future in-shell UI without moving files into core components/.
 */
export function AiEcommercePlugin() {
  return (
    <div className="flex-1 min-h-0 grid place-items-center p-8 text-ui text-muted">
      AI ecommerce plugin shell — use embed mode for the live workbench.
    </div>
  );
}
