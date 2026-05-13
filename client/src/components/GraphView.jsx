export default function GraphView({ transactions = [] }) {
  const latest = transactions.slice(0, 8);

  // Decision colors
  const decisionColors = {
    allow: "#22c55e",
    otp: "#facc15",
    review: "#facc15",
    block: "#ef4444",
  };

  // Central user node
  const userNode = {
    id: "user",
    x: 50,
    y: 50,
    label: "User",
    color: "#14b8a6",
    type: "user",
  };

  // Create transaction nodes
  const transactionNodes = latest.map((tx, index) => ({
    id: `tx-${index}`,
    x: 50,
    y: 18 + index * 8,
    label: `${tx.decision?.toUpperCase()} (${Math.round(
      (tx.scores?.risk || 0) * 100
    )}%)`,
    color: decisionColors[tx.decision] || "#94a3b8",
    type: "transaction",
    tx,
  }));

  // Create device + location nodes
  const extraNodes = latest.flatMap((tx, index) => [
    {
      id: `device-${index}`,
      x: 18,
      y: 18 + index * 8,
      label: String(tx.deviceId || "unknown").slice(0, 10),
      color: "#64748b",
      type: "device",
      parent: `tx-${index}`,
    },
    {
      id: `location-${index}`,
      x: 82,
      y: 18 + index * 8,
      label: tx.location?.city || "Unknown",
      color:
        tx.decision === "block"
          ? "#ef4444"
          : tx.decision === "otp" || tx.decision === "review"
          ? "#facc15"
          : "#22c55e",
      type: "location",
      parent: `tx-${index}`,
    },
  ]);

  const nodes = [userNode, ...transactionNodes, ...extraNodes];

  return (
    <div className="panel rounded-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entity Graph</h2>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Allow</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <span>OTP/Review</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Blocked</span>
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="h-[500px] w-full rounded-xl bg-slate-50 dark:bg-slate-900"
      >
        {/* USER → TRANSACTION */}
        {transactionNodes.map((node) => (
          <line
            key={`user-line-${node.id}`}
            x1={userNode.x}
            y1={userNode.y}
            x2={node.x}
            y2={node.y}
            stroke="#64748b"
            strokeWidth="0.4"
          />
        ))}

        {/* TRANSACTION → DEVICE/LOCATION */}
        {extraNodes.map((node) => {
          const parentTx = transactionNodes.find(
            (tx) => tx.id === node.parent
          );

          return (
            <line
              key={`line-${node.id}`}
              x1={parentTx?.x}
              y1={parentTx?.y}
              x2={node.x}
              y2={node.y}
              stroke="#94a3b8"
              strokeWidth="0.35"
            />
          );
        })}

        {/* NODES */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={
                node.type === "user"
                  ? 5
                  : node.type === "transaction"
                  ? 3.8
                  : 3
              }
              fill={node.color}
              className="transition-all duration-200 hover:r-[5]"
            />

            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="fill-slate-700 text-[2.6px] dark:fill-slate-200"
            >
              {node.label}
            </text>

            {/* Amount */}
            {node.type === "transaction" && (
              <text
                x={node.x}
                y={node.y - 4}
                textAnchor="middle"
                className="fill-slate-500 text-[2px]"
              >
                ₹{node.tx.amount}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Transaction Details */}
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {latest.map((tx, index) => (
          <div
            key={tx._id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {tx.merchant || "Unknown Merchant"}
              </p>

              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  tx.decision === "block"
                    ? "bg-red-500/20 text-red-400"
                    : tx.decision === "otp" ||
                      tx.decision === "review"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {tx.decision?.toUpperCase()}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>Amount: ₹{tx.amount}</p>

              <p>Risk Score: {(tx.scores?.risk || 0) * 100}%</p>

              <p>Device: {tx.deviceId}</p>

              <p>
                Location: {tx.location?.city},{" "}
                {tx.location?.country}
              </p>

              <p>
                Time:{" "}
                {new Date(tx.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}