'use client'

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { setup2FA, enable2FA } from "@/lib/api/twoFactor";
import { copyToClipboard } from "@/lib/utils/clipboard";

const RATE_LIMIT_KEY = '2fa_rate_limit_until';

export function Setup2FAModal({ show, onClose, onSuccess, token }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: QR, 2: Backup Codes, 3: Verify
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const countdownRef = useRef(null);

  // Check localStorage for existing rate limit on mount
  useEffect(() => {
    const checkRateLimit = () => {
      try {
        const storedUntil = localStorage.getItem(RATE_LIMIT_KEY);
        if (storedUntil) {
          const until = parseInt(storedUntil, 10);
          const now = Date.now();
          if (until > now) {
            const remaining = Math.ceil((until - now) / 1000);
            setCountdown(remaining);
          } else {
            localStorage.removeItem(RATE_LIMIT_KEY);
            setCountdown(0);
          }
        } else {
          setCountdown(0);
        }
      } catch {}
    };
    checkRateLimit();
  }, [show]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            try { localStorage.removeItem(RATE_LIMIT_KEY); } catch {}
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [countdown]);

  // Fetch setup data when modal opens
  useEffect(() => {
    if (show && !setupData) {
      const fetchSetup = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await setup2FA(token);
          setSetupData(res);
          setStep(1);
        } catch (err) {
          setError(err?.message || "Failed to setup 2FA");
        } finally {
          setLoading(false);
        }
      };
      fetchSetup();
    }
  }, [show, token, setupData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setStep(1);
      setSetupData(null);
      setTotpCode("");
      setError("");
      setCopiedSecret(false);
      setCopiedCodes(false);
    }
  }, [show]);

  const handleCopySecret = async () => {
    if (!setupData?.secret) return;
    await copyToClipboard(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = async () => {
    if (!setupData?.backupCodes) return;
    await copyToClipboard(setupData.backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    const text = `BullPay 2FA Backup Codes\n${"=".repeat(30)}\n\n${setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bullpay-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = totpCode.split("");
    newCode[index] = digit;
    setTotpCode(newCode.join("").slice(0, 6));
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setTotpCode(pasted);
    if (pasted.length === 6) inputRefs.current[5]?.focus();
  };

  const handleEnable = async () => {
    if (countdown > 0) return;
    if (totpCode.length !== 6) {
      setError(t("settings.2fa.errorInvalidCode", { defaultValue: "Please enter a valid 6-digit code" }));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await enable2FA(token, totpCode);
      onSuccess?.();
      onClose();
    } catch (err) {
      const retryAfter = err?.retryAfterSeconds
        || err?.data?.retryAfterSeconds
        || err?.data?.error?.retryAfterSeconds;
      if (retryAfter && retryAfter > 0) {
        const until = Date.now() + (retryAfter * 1000);
        try { localStorage.setItem(RATE_LIMIT_KEY, until.toString()); } catch {}
        setCountdown(retryAfter);
        setError(t("settings.2fa.tooManyAttempts", {
          defaultValue: "Too many attempts. Please try again in {{seconds}} seconds",
          seconds: retryAfter
        }));
      } else {
        setError(err?.message || "Failed to enable 2FA");
      }
      setTotpCode("");
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
            <h5 className="modal-title">
              {t("settings.2fa.setupTitle", { defaultValue: "Setup Two-Factor Authentication" })}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body">
            {/* Progress Steps */}
            <div className="d-flex justify-content-center mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="d-flex align-items-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                      step >= s ? "bg-primary text-white" : "bg-light text-muted"
                    }`}
                    style={{ width: 32, height: 32, fontSize: 14 }}
                  >
                    {step > s ? <i className="bx bx-check"></i> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`mx-2 ${step > s ? "bg-primary" : "bg-light"}`}
                      style={{ width: 40, height: 2 }}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {loading && !setupData ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">{t("common.loading", { defaultValue: "Loading..." })}</p>
              </div>
            ) : error && !setupData ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                {/* Step 1: QR Code */}
                {step === 1 && setupData && (
                  <div className="text-center">
                    <p className="text-muted mb-3">
                      {t("settings.2fa.scanQRDescription", {
                        defaultValue: "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)",
                      })}
                    </p>
                    <div className="d-flex justify-content-center mb-3">
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="border rounded"
                        style={{ width: 200, height: 200 }}
                      />
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">
                        {t("settings.2fa.cantScan", { defaultValue: "Can't scan? Enter this code manually:" })}
                      </small>
                      <div className="input-group input-group-sm" style={{ maxWidth: 300, margin: "0 auto" }}>
                        <input
                          type="text"
                          className="form-control text-center font-monospace"
                          value={setupData.secret}
                          readOnly
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleCopySecret}
                          title="Copy"
                        >
                          <i className={`bx ${copiedSecret ? "bx-check" : "bx-copy"}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Backup Codes */}
                {step === 2 && setupData && (
                  <div>
                    <div className="alert alert-warning d-flex align-items-start mb-3">
                      <i className="bx bx-error-circle me-2 mt-1"></i>
                      <div>
                        <strong>{t("settings.2fa.saveBackupCodes", { defaultValue: "Save your backup codes!" })}</strong>
                        <p className="mb-0 small">
                          {t("settings.2fa.backupCodesDescription", {
                            defaultValue:
                              "If you lose access to your authenticator app, you can use these codes to sign in. Each code can only be used once.",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-light rounded p-3 mb-3">
                      <div className="row g-2">
                        {setupData.backupCodes.map((code, i) => (
                          <div key={code} className="col-6">
                            <code className="d-block text-center py-1">
                              {i + 1}. {code}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="d-flex justify-content-center gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCopyBackupCodes}>
                        <i className={`bx ${copiedCodes ? "bx-check" : "bx-copy"} me-1`}></i>
                        {copiedCodes
                          ? t("common.copied", { defaultValue: "Copied!" })
                          : t("common.copy", { defaultValue: "Copy" })}
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDownloadBackupCodes}>
                        <i className="bx bx-download me-1"></i>
                        {t("common.download", { defaultValue: "Download" })}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Verify */}
                {step === 3 && (
                  <div className="text-center">
                    <p className="text-muted mb-3">
                      {t("settings.2fa.enterCode", {
                        defaultValue: "Enter the 6-digit code from your authenticator app to verify setup",
                      })}
                    </p>
                    <div className="d-flex justify-content-center gap-2 mb-3" onPaste={handlePaste}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={`digit-${i}`}
                          ref={(el) => (inputRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          className="form-control text-center fw-bold"
                          style={{ width: 45, height: 50, fontSize: 20 }}
                          maxLength={1}
                          value={totpCode[i] || ""}
                          onChange={(e) => handleCodeChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          autoFocus={i === 0}
                          disabled={countdown > 0}
                        />
                      ))}
                    </div>
                    {error && (
                      <div className="alert alert-danger py-2">
                        {countdown > 0
                          ? t("settings.2fa.tooManyAttempts", {
                              defaultValue: "Too many attempts. Please try again in {{seconds}} seconds",
                              seconds: countdown
                            })
                          : error
                        }
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            {step > 1 && (
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(s => s - 1)} disabled={loading}>
                <i className="bx bx-chevron-left me-1"></i>
                {t("common.back", { defaultValue: "Back" })}
              </button>
            )}
            <div className="flex-grow-1"></div>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={loading || !setupData}
              >
                {t("common.continue", { defaultValue: "Continue" })}
                <i className="bx bx-chevron-right ms-1"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEnable}
                disabled={loading || totpCode.length !== 6 || countdown > 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    {t("common.verifying", { defaultValue: "Verifying..." })}
                  </>
                ) : countdown > 0 ? (
                  <>
                    <i className="bx bx-time me-1"></i>
                    {t("settings.2fa.retryIn", { defaultValue: "Retry in {{seconds}}s", seconds: countdown })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-check me-1"></i>
                    {t("settings.2fa.enableButton", { defaultValue: "Enable 2FA" })}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
