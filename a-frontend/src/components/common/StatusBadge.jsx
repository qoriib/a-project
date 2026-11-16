import "./StatusBadge.css";

/**
 * Standardized Status & Stage Badge for the 5-Level Approval Workflow
 */
export function StatusBadge({ status, stage, size = "md", className = "" }) {
  const getBadgeConfig = () => {
    const rawVal = (stage || status || "").toString().trim().toUpperCase();

    // Specific stages
    switch (rawVal) {
      case "DRAFT":
        return {
          label: "Draft",
          variant: "draft",
          icon: "📝",
        };
      case "PENDING_L1":
      case "ASISTEN_KADIV":
      case "VM":
        return {
          label: "L1: Verifikasi VM",
          variant: "level-1",
          icon: "🔍",
        };
      case "PENDING_L2":
      case "KADIV":
      case "KADIV_REQUESTER":
      case "SCM":
        return {
          label: "L2: Approval SCM",
          variant: "level-2",
          icon: "👤",
        };
      case "PENDING_L3":
      case "ACCOUNTING":
        return {
          label: "L3: Input Accounting",
          variant: "level-3",
          icon: "💼",
        };
      case "PENDING_L4":
      case "TAX":
        return {
          label: "L4: Input Tax",
          variant: "level-4",
          icon: "🏷️",
        };
      case "PENDING_L5":
      case "SAP":
        return {
          label: "L5: Review SAP",
          variant: "level-5",
          icon: "⚙️",
        };
      case "FORM_APPROVED":
        return {
          label: "Form Approved",
          variant: "form-approved",
          icon: "📄",
        };
      case "COMPLETED":
      case "DONE":
      case "APPROVED":
      case "ACTIVE":
        return {
          label: rawVal === "ACTIVE" ? "Aktif" : "Selesai / Approved",
          variant: "completed",
          icon: "✓",
        };
      case "REJECTED":
      case "INACTIVE":
        return {
          label: rawVal === "INACTIVE" ? "Nonaktif" : "Ditolak",
          variant: "rejected",
          icon: "✕",
        };
      case "UNDER REVIEW":
      case "UNDER_REVIEW":
        return {
          label: "Under Review",
          variant: "review",
          icon: "⏳",
        };
      case "PENDING":
        return {
          label: "Pending",
          variant: "pending",
          icon: "⏳",
        };
      default:
        return {
          label: status || stage || "-",
          variant: "default",
          icon: "•",
        };
    }
  };

  const { label, variant, icon } = getBadgeConfig();

  return (
    <span
      className={`status-badge-root status-badge-${variant} status-badge-${size} ${className}`}
    >
      <span className="status-badge-dot">{icon}</span>
      <span className="status-badge-text">{label}</span>
    </span>
  );
}

export default StatusBadge;
