import "../styles/StatusBadge.css";

const STATUS_LABELS = {
  active: "Active",
  at_risk: "At Risk",
  completed: "Completed",
};

const STAGE_LABELS = {
  planted: "Planted",
  growing: "Growing",
  ready: "Ready",
  harvested: "Harvested",
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-status badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function StageBadge({ stage }) {
  return (
    <span className={`badge badge-stage badge-stage-${stage}`}>
      {STAGE_LABELS[stage] || stage}
    </span>
  );
}
