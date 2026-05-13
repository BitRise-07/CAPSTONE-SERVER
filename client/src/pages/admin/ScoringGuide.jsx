import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import api from "../../services/api";

export default function ScoringGuide() {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/scoring-guide")
      .then(({ data }) => setGuide(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading scoring guide" />;

  return (
    <div>
      <PageHeader
        eyebrow="Admin route"
        title="Scoring Guide"
        description="A plain-language guide to how rules, anomaly score, ML probability, and hard blocks combine."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">Risk Bands</h2>
          <div className="space-y-3">
            {Object.entries(guide?.graphBands || {}).map(([band, rule]) => (
              <div key={band} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <span className="font-semibold capitalize">{band}</span>
                <span className="text-sm text-slate-500">{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">Final Risk Formula</h2>
          <div className="space-y-3 text-sm">
            {Object.entries(guide?.finalRiskFormula || {}).map(([key, value]) => (
              <div key={key} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <p className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-1 text-slate-500">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">Rule Severity</h2>
          <div className="space-y-3">
            {Object.entries(guide?.ruleSeverityToNumber || {}).map(([level, value]) => (
              <div key={level} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <span className="font-semibold capitalize">{level}</span>
                <span className="text-sm text-slate-500">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">ML Role</h2>
          <div className="space-y-3 text-sm text-slate-500">
            {(guide?.mlRole || []).map((item) => (
              <p key={item} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Metric Note</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(guide?.metricNote || {}).map(([key, value]) => (
              <div key={key} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
                <p className="font-semibold uppercase text-slate-700 dark:text-slate-200">{key}</p>
                <p className="mt-2 text-slate-500">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
