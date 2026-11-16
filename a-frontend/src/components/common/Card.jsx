export function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  style = {},
  noPadding = false,
}) {
  return (
    <div className={`card-standard ${className}`} style={style}>
      {(title || subtitle || action) && (
        <div className="card-standard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {icon && <span style={{ fontSize: "18px" }}>{icon}</span>}
            <div>
              {title && <h5 className="card-standard-title">{title}</h5>}
              {subtitle && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div
        className="card-standard-body"
        style={noPadding ? { padding: 0 } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export default Card;
