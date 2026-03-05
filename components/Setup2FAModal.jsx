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
          setError(err?.message || t("settings.2fa.failedSetup", { defaultValue: "Failed to setup 2FA" }));
        } finally {
          setLoading(false);
        }
      };
      fetchSetup();
    }
  }, [show, token, setupData]);

  // Reset state when modal closes
  const handleClose = () => {
    setStep(1);
    setSetupData(null);
    setTotpCode("");
    setError("");
    setCopiedSecret(false);
    setCopiedCodes(false);
    onClose();
  };

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
    const title = t("settings.2fa.backupCodesDownloadTitle", { defaultValue: "BullPay 2FA Backup Codes" });
    const footer = t("settings.2fa.backupCodesKeepSafe", { defaultValue: "Keep these codes safe. Each code can only be used once." });
    const text = `${title}\n${"=".repeat(30)}\n\n${setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n${footer}`;
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
      handleClose();
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
        setError(err?.message || t("settings.2fa.failedEnable", { defaultValue: "Failed to enable 2FA" }));
      }
      setTotpCode("");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: '500px' }}>
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">
              {t("settings.2fa.setupTitle", { defaultValue: "Setup Two-Factor Authentication" })}
            </h5>
            <button type="button" className="text-surface-400 hover:text-surface-700 text-xl leading-none" onClick={handleClose} disabled={loading}>&times;</button>
          </div>

          <div className="p-6">
            {/* Progress Steps */}
            <div className="flex justify-center mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`rounded-full flex items-center justify-center ${ step >= s ?"bg-primary-600 text-white" : "bg-surface-100 text-surface-500"
                    }`}
                    style={{ width: 32, height: 32, fontSize: 14 }}
                  >
                    {step > s ? <i className="bx bx-check"></i> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`mx-2 ${step > s ?"bg-primary-600" : "bg-surface-100"}`}
                      style={{ width: 40, height: 2 }}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {loading && !setupData ? (
              <div className="text-center py-10">
                <div className="spinner w-8 h-8 border-3 text-primary-600" role="status"></div>
                <p className="mt-2 text-surface-500">{t("common.loading", { defaultValue: "Loading..." })}</p>
              </div>
            ) : error && !setupData ? (
              <div className="rounded-lg bg-red-50 text-red-700 p-4">{error}</div>
            ) : (
              <>
                {/* Step 1: QR Code */}
                {step === 1 && setupData && (
                  <div className="text-center">
                    <p className="text-surface-500 mb-3">
                      {t("settings.2fa.scanQRDescription", {
                        defaultValue: "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)",
                      })}
                    </p>
                    <div className="flex justify-center mb-3">
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="border rounded-lg"
                        style={{ width: 200, height: 200 }}
                      />
                    </div>
                    <div className="mb-3">
                      <small className="text-surface-500 block mb-1">
                        {t("settings.2fa.cantScan", { defaultValue: "Can't scan? Enter this code manually:" })}
                      </small>
                      <div className="bp-input-group" style={{ maxWidth: 300, margin: "0 auto" }}>
                        <input
                          type="text"
                          className="form-input text-center font-mono text-sm"
                          value={setupData.secret}
                          readOnly
                        />
                        <button
                          type="button"
                          className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100"
                          onClick={handleCopySecret}
                          title={t("actions.copy", { defaultValue: "Copy" })}
                        >
                          <i className={`bx ${copiedSecret ?"bx-check" : "bx-copy"}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Backup Codes */}
                {step === 2 && setupData && (
                  <div>
                    <div className="rounded-lg bg-amber-50 text-amber-700 p-3 flex items-start mb-3">
                      <i className="bx bx-error-circle mr-2 mt-1"></i>
                      <div>
                        <strong>{t("settings.2fa.saveBackupCodes", { defaultValue: "Save your backup codes!" })}</strong>
                        <p className="mb-0 text-sm">
                          {t("settings.2fa.backupCodesDescription", {
                            defaultValue:
                              "If you lose access to your authenticator app, you can use these codes to sign in. Each code can only be used once.",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        {setupData.backupCodes.map((code, i) => (
                          <div key={code}>
                            <code className="block text-center py-1">
                              {i + 1}. {code}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" onClick={handleCopyBackupCodes}>
                        <i className={`bx ${copiedCodes ?"bx-check" : "bx-copy"} mr-1`}></i>
                        {copiedCodes
                          ? t("common.copied", { defaultValue: "Copied!" })
                          : t("common.copy", { defaultValue: "Copy" })}
                      </button>
                      <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" onClick={handleDownloadBackupCodes}>
                        <i className="bx bx-download mr-1"></i>
                        {t("common.download", { defaultValue: "Download" })}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Verify */}
                {step === 3 && (
                  <div className="text-center">
                    <p className="text-surface-500 mb-3">
                      {t("settings.2fa.enterCode", {
                        defaultValue: "Enter the 6-digit code from your authenticator app to verify setup",
                      })}
                    </p>
                    <div className="flex justify-center gap-2 mb-3" onPaste={handlePaste}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={`digit-${i}`}
                          ref={(el) => (inputRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          className="form-input text-center font-bold"
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
                      <div className="rounded-lg bg-red-50 text-red-700 py-2 px-3">
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

          <div className="px-6 py-4 border-t border-surface-200 flex items-center">
            {step > 1 && (
              <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={() => setStep(s => s - 1)} disabled={loading}>
                <i className="bx bx-chevron-left mr-1"></i>
                {t("common.back", { defaultValue: "Back" })}
              </button>
            )}
            <div className="grow"></div>
            <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mr-2" onClick={handleClose} disabled={loading}>
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
                <i className="bx bx-chevron-right ml-1"></i>
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
                    <span className="spinner w-4 h-4 border-2 mr-1 inline-block align-middle"></span>
                    {t("common.verifying", { defaultValue: "Verifying..." })}
                  </>
                ) : countdown > 0 ? (
                  <>
                    <i className="bx bx-time mr-1"></i>
                    {t("settings.2fa.retryIn", { defaultValue: "Retry in {{seconds}}s", seconds: countdown })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-check mr-1"></i>
                    {t("settings.2fa.enableButton", { defaultValue: "Enable 2FA" })}
                  </>
                )}
              </button>
            )}
          </div>
      </div>
    </div>
  );
}
