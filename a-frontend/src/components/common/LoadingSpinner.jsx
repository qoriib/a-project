export function LoadingSpinner({
  message = "Memuat data...",
  size = "md",
  fullPage = false,
}) {
  const spinnerSize = size === "sm" ? "1.25rem" : size === "lg" ? "2.5rem" : "1.75rem";

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: fullPage ? "60px 20px" : "30px 10px",
        color: "#64748b",
      }}
    >
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ width: spinnerSize, height: spinnerSize }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <span style={{ fontSize: "14px", fontWeight: 500 }}>{message}</span>
      )}
    </div>
  );

  return content;
}

export default LoadingSpinner;
