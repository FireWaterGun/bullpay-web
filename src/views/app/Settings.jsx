import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { get2FAStatus } from "../../api/twoFactor";
import { Setup2FAModal, Disable2FAModal } from "./TwoFactorModals";

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
