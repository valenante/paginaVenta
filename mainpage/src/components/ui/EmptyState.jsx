import { FiInbox } from "react-icons/fi";
import "./EmptyState.css";

export default function EmptyState({
  icon: Icon = FiInbox,
  title = "Sin datos",
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap">
        <Icon className="empty-state__icon" />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {actionLabel && onAction && (
        <button className="empty-state__btn" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
