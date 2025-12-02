import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { get2FAStatus, setup2FA, enable2FA, disable2FA } from "../../api/twoFactor";

// ===== Setup 2FA Modal =====
function Setup2FAModal({ show, onClose, onSuccess, token }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: QR, 2: Backup Codes, 3: Verify
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const inputRefs = useRef([]);

  // Fetch setup data when modal opens
  useEffect(() => {
    if (show && !setupData) {
      const fetchSetup = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await setup2FA(token);
          setSetupData(res.data);
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
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      const text = setupData.backupCodes.join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const text = `BullPay 2FA Backup Codes\n${"=".repeat(30)}\n\n${setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nKeep these codes safe. Each code can only be used once.`;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bullpay-2fa-backup-codes.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = totpCode.split("");
    newCode[index] = digit;
    const joined = newCode.join("").slice(0, 6);
    setTotpCode(joined);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setTotpCode(pasted);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleEnable = async () => {
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
      setError(err?.message || "Failed to enable 2FA");
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
                          <div key={i} className="col-6">
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
                          key={i}
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
                        />
                      ))}
                    </div>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            {step > 1 && (
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(step - 1)} disabled={loading}>
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
                onClick={() => setStep(step + 1)}
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
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    {t("common.verifying", { defaultValue: "Verifying..." })}
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

// ===== Disable 2FA Modal =====
function Disable2FAModal({ show, onClose, onSuccess, token }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) {
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }, [show]);

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
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to disable 2FA");
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
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
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
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
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

// ===== Main Settings Component =====
export default function Settings() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await get2FAStatus(token);
      setTwoFAStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch 2FA status:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified;

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {/* Page Header */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="mb-1">{t("settings.title", { defaultValue: "Settings" })}</h5>
            <small className="text-muted">
              {t("settings.subtitle", { defaultValue: "Manage your account settings and preferences" })}
            </small>
          </div>
        </div>

        {/* Security Section */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              {t("settings.security.title", { defaultValue: "Security" })}
            </h6>
          </div>
          <div className="card-body">
            {/* 2FA Section */}
            <div className="d-flex align-items-start justify-content-between">
              <div className="d-flex align-items-start">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-label-primary"
                  style={{ width: 48, height: 48 }}
                >
                  <i className="bx bx-lock-alt fs-4 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-1">{t("settings.2fa.title", { defaultValue: "Two-Factor Authentication" })}</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-8"></span>
                    </div>
                  ) : is2FAEnabled ? (
                    <>
                      <span className="badge bg-success me-2">
                        <i className="bx bx-check-circle me-1"></i>
                        {t("settings.2fa.enabled", { defaultValue: "Enabled" })}
                      </span>
                      {twoFAStatus?.verifiedAt && (
                        <small className="text-muted">
                          {t("settings.2fa.enabledSince", { defaultValue: "Since" })}{" "}
                          {new Date(twoFAStatus.verifiedAt).toLocaleDateString()}
                        </small>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="badge bg-secondary me-2">
                        {t("settings.2fa.disabled", { defaultValue: "Disabled" })}
                      </span>
                      <small className="text-muted d-block mt-1">
                        {t("settings.2fa.description", {
                          defaultValue:
                            "Add an extra layer of security. We'll ask for a code from your authenticator app when you sign in.",
                        })}
                      </small>
                    </>
                  )}
                </div>
              </div>
              <div>
                {loading ? (
                  <button className="btn btn-outline-primary" disabled>
                    <span className="spinner-border spinner-border-sm"></span>
                  </button>
                ) : is2FAEnabled ? (
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bx bx-cog me-1"></i>
                      {t("common.manage", { defaultValue: "Manage" })}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => setShowDisableModal(true)}
                        >
                          <i className="bx bx-power-off me-2"></i>
                          {t("settings.2fa.disable", { defaultValue: "Disable 2FA" })}
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => setShowSetupModal(true)}>
                    <i className="bx bx-lock me-1"></i>
                    {t("settings.2fa.enable", { defaultValue: "Enable 2FA" })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={fetchStatus}
        token={token}
      />
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={fetchStatus}
        token={token}
      />
    </div>
  );
}
