'use client'

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { disable2FA } from "@/lib/api/twoFactor";

export { Setup2FAModal } from "./Setup2FAModal";

export function Disable2FAModal({ show, onClose, onSuccess, token }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setPassword("");
    setTotpCode("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleDisable = async () => {
    if (!password) {
      setError(t("settings.2fa.errorPasswordRequired", { defaultValue: "Password is required" }));
      return;
    }
    if (!totpCode) {
      setError(t("settings.2fa.errorCodeRequired", { defaultValue: "2FA code is required" }));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await disable2FA(token, password, totpCode);
      onSuccess?.();
      handleClose();
    } catch (err) {
      if (err?.retryAfterSeconds) {
        setError(t("settings.2fa.tooManyAttempts", {
          seconds: err.retryAfterSeconds,
          defaultValue: `Too many attempts. Please try again in ${err.retryAfterSeconds} seconds`,
        }));
      } else if (err?.remainingAttempts !== undefined) {
        setError(err?.message || t("settings.2fa.failedDisable", { defaultValue: "Failed to disable 2FA" }));
      } else {
        setError(err?.message || t("settings.2fa.failedDisable", { defaultValue: "Failed to disable 2FA" }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: '460px' }}>
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">{t("settings.2fa.disableTitle", { defaultValue: "Disable 2FA" })}</h5>
            <button type="button" className="text-surface-400 hover:text-surface-700 text-xl leading-none" onClick={handleClose} disabled={loading}>&times;</button>
          </div>
          <div className="p-6">
            <div className="rounded-lg bg-amber-50 text-amber-700 p-3 flex items-start mb-4">
              <i className="bx bx-error-circle text-lg mr-2"></i>
              <span>
                {t("settings.2fa.disableWarning", {
                  defaultValue: "Disabling 2FA will make your account less secure.",
                })}
              </span>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">
                {t("settings.2fa.enterPassword", { defaultValue: "Enter your password to confirm" })}
              </label>
              <div className="bp-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input text-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("common.password", { defaultValue: "Password" })}
                  maxLength={50}
                  autoFocus
                />
                <span
                  className="bp-input-suffix cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`}></i>
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">
                {t("settings.2fa.enterDisableCode", { defaultValue: "Enter your 2FA code or backup code" })}
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input text-lg"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder={t("settings.2fa.codePlaceholder", { defaultValue: "6-digit code or backup code" })}
                maxLength={20}
                autoComplete="one-time-code"
              />
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={loading}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDisable} disabled={loading || !password || !totpCode}>
              {loading ? (
                <>
                  <span className="spinner w-4 h-4 border-2 mr-1 inline-block align-middle"></span>
                  {t("common.processing", { defaultValue: "Processing..." })}
                </>
              ) : (
                t("settings.2fa.disableButton", { defaultValue: "Disable 2FA" })
              )}
            </button>
          </div>
      </div>
    </div>
  );
}
