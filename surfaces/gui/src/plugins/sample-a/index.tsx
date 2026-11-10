import { useTranslation } from "react-i18next";

/**
 * 行业应用 A — local plugin page (mode=plugin).
 * Renders inside PluginHost; no iframe / external URL.
 */
export function SampleAPlugin() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-7 py-8" data-testid="plugin-sample-a">
      <h1 className="text-title font-semibold text-ink mb-2">{t("industry_apps.sample_a.heading")}</h1>
      <p className="text-ui text-muted leading-relaxed mb-6">{t("industry_apps.sample_a.intro")}</p>

      <section className="rounded-xl2 border border-line bg-panel p-4 mb-3">
        <h2 className="text-body font-semibold text-ink mb-1.5">{t("industry_apps.sample_a.what_title")}</h2>
        <p className="text-ui text-muted leading-relaxed">{t("industry_apps.sample_a.what_body")}</p>
      </section>

      <section className="rounded-xl2 border border-line bg-panel p-4 mb-3">
        <h2 className="text-body font-semibold text-ink mb-1.5">{t("industry_apps.sample_a.how_title")}</h2>
        <ul className="text-ui text-muted leading-relaxed list-disc pl-5 space-y-1">
          <li>{t("industry_apps.sample_a.how_1")}</li>
          <li>{t("industry_apps.sample_a.how_2")}</li>
          <li>{t("industry_apps.sample_a.how_3")}</li>
        </ul>
      </section>

      <section className="rounded-xl2 border border-line bg-panel p-4">
        <h2 className="text-body font-semibold text-ink mb-1.5">{t("industry_apps.sample_a.diff_title")}</h2>
        <p className="text-ui text-muted leading-relaxed">{t("industry_apps.sample_a.diff_body")}</p>
      </section>
    </div>
  );
}
