import { formatRoleLabel } from '../../utils/roles'

const MODAL_CONFIG = {
  grant: {
    title: 'Grant Permission',
    icon: 'bx-plus-circle',
    iconColor: 'text-success',
    btnClass: 'btn-success',
    btnIcon: 'bx-check',
    btnLabel: 'Grant',
    placeholder: 'e.g. admin.users.view',
    reasonPlaceholder: 'Why is this permission being granted?',
    verb: 'grant to',
  },
  deny: {
    title: 'Deny Permission',
    icon: 'bx-minus-circle',
    iconColor: 'text-danger',
    btnClass: 'btn-danger',
    btnIcon: 'bx-x',
    btnLabel: 'Deny',
    placeholder: 'e.g. admin.users.delete',
    reasonPlaceholder: 'Why is this permission being denied?',
    verb: 'deny for',
  },
}

export default function PermissionActionModal({ action, role, permission, reason, onPermissionChange, onReasonChange, onSubmit, onClose, disabled }) {
  const cfg = MODAL_CONFIG[action]
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bx ${cfg.icon} ${cfg.iconColor} me-2`}></i>
              {cfg.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Permission Name</label>
              <input
                type="text"
                className="form-control"
                placeholder={cfg.placeholder}
                value={permission}
                onChange={(e) => onPermissionChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
              <small className="text-muted mt-1 d-block">
                Enter the permission to {cfg.verb} <strong>{formatRoleLabel(role)}</strong>
              </small>
            </div>
            <div>
              <label className="form-label">Reason <span className="text-muted">(optional)</span></label>
              <textarea
                className="form-control"
                rows="2"
                placeholder={cfg.reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button
              className={`btn ${cfg.btnClass}`}
              onClick={onSubmit}
              disabled={!permission.trim() || disabled}
            >
              <i className={`bx ${cfg.btnIcon} me-1`}></i>{cfg.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
