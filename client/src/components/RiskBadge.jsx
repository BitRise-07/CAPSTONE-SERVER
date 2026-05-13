import { percent, riskTone } from "../utils/format";

export default function RiskBadge({ decision, risk }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${riskTone(
        decision,
      )}`}
    >
      {decision?.toUpperCase() || "ALLOW"}{" "}
      {typeof risk === "number" ? percent(risk) : ""}
    </span>
  );
}
