'use client'

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { disable2FA } from "@/lib/api/twoFactor";

export { Setup2FAModal } from "./Setup2FAModal";

export function Disable2FAModal({ show, onClose, onSuccess, token }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleDisable = async () => {
    if (!password) {
      setError(t("settings.2fa.errorPasswordRequired", { defaultValue: "Password is required" }));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await disable2FA(token, password);
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err?.message || t("settings.2fa.failedDisable", { defaultValue: "Failed to disable 2FA" }));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("settings.2fa.disableTitle", { defaultValue: "Disable 2FA" })}</h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-warning d-flex align-items-start mb-4">
              <i className="bx bx-error-circle fs-5 me-2"></i>
              <span>
                {t("settings.2fa.disableWarning", {
                  defaultValue: "Disabling 2FA will make your account less secure.",
                })}
              </span>
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">
                {t("settings.2fa.enterPassword", { defaultValue: "Enter your password to confirm" })}
              </label>
              <div className="input-group input-group-merge">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("common.password", { defaultValue: "Password" })}
                  maxLength={50}
                  autoFocus
                />
                <span
                  className="input-group-text cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                >
                  <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`}></i>
                </span>
              </div>
              {error && <div className="text-danger mt-2">{error}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={loading}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDisable} disabled={loading || !password}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {t("common.processing", { defaultValue: "Processing..." })}
                </>
              ) : (
                t("settings.2fa.disableButton", { defaultValue: "Disable 2FA" })
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
