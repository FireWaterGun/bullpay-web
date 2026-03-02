'use client'

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/providers";
import { verify2FA } from "@/lib/api/twoFactor";
import { logger } from '@/lib/utils/logger'

export default function Verify2FAModal({
  show,
  onClose,
  onSuccess,
  title,
  description,
  skipVerify = false,
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const inputRefs = useRef([]);

  const handleClose = () => {
    setCode("");
    setError("");
    setIsBackupCode(false);
    onClose();
  };

  const handleCodeChange = (index, value) => {
    if (isBackupCode) {
      setCode(value.toUpperCase());
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = code.split("");
    newCode[index] = digit;
    const joined = newCode.join("").slice(0, 6);
    setCode(joined);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (isBackupCode) return;
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (isBackupCode) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setCode(pasted);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isBackupCode && code.length !== 6) {
      setError(t("2fa.errorInvalidCode", { defaultValue: "Please enter a valid 6-digit code" }));
      return;
    }
    if (isBackupCode && !code.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      setError(t("2fa.errorInvalidBackupCode", { defaultValue: "Please enter a valid backup code (e.g., ABCD-EFGH)" }));
      return;
    }
    if (skipVerify) {
      onSuccess?.(code);
      handleClose();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await verify2FA(token, code);
      if (res.isBackupCode && res.remainingBackupCodes !== undefined) {
        if (res.remainingBackupCodes <= 3) {
          logger.warn("Warning: Only " + res.remainingBackupCodes + " backup codes remaining");
        }
      }
      onSuccess?.(res);
      handleClose();
    } catch (err) {
      setError(err?.message || t("2fa.errorVerificationFailed", { defaultValue: "Verification failed" }));
    } finally {
      setLoading(false);
    }
  };

  const toggleBackupCode = () => {
    setIsBackupCode(!isBackupCode);
    setCode("");
    setError("");
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {title || t("2fa.verifyTitle", { defaultValue: "Two-Factor Authentication" })}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted text-center mb-4">
              {description || t("2fa.verifyDescription", {
                defaultValue: "Enter the 6-digit code from your authenticator app"
              })}
            </p>
            {isBackupCode ? (
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control text-center font-monospace"
                  placeholder="ABCD-EFGH"
                  value={code}
                  onChange={(e) => handleCodeChange(0, e.target.value)}
                  maxLength={9}
                  autoFocus
                />
              </div>
            ) : (
              <div className="d-flex justify-content-center gap-2 mb-3" onPaste={handlePaste}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={"digit-" + i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    className="form-control text-center fw-bold"
                    style={{ width: 40, height: 45, fontSize: 18 }}
                    maxLength={1}
                    value={code[i] || ""}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            )}
            {error && (
              <div className="alert alert-danger py-2 mb-3">
                <small>{error}</small>
              </div>
            )}
            <div className="text-center">
              <button type="button" className="btn btn-link btn-sm text-muted" onClick={toggleBackupCode}>
                {isBackupCode
                  ? t("2fa.useAuthenticator", { defaultValue: "Use authenticator app instead" })
                  : t("2fa.useBackupCode", { defaultValue: "Use backup code instead" })}
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={loading}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={loading || (!isBackupCode && code.length !== 6) || (isBackupCode && !code)}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {t("common.verifying", { defaultValue: "Verifying..." })}
                </>
              ) : (
                <>
                  <i className="bx bx-check me-1"></i>
                  {t("common.verify", { defaultValue: "Verify" })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
