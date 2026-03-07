'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { disable2FA } from "@/lib/api/twoFactor";
import Button from '@/components/ui/Button'
import { Input, InputGroup, InputIcon } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

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
          defaultValue: `Too many attempts. Please try again in ${err.retryAfterSeconds} seconds`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl mx-4 w-full max-w-[460px]">
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">{t("settings.2fa.disableTitle", { defaultValue: "Disable 2FA" })}</h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={handleClose} disabled={loading}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-6">
            <div className="rounded-lg bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300 p-3 flex items-start mb-4">
              <i className="bx bx-error-circle text-lg mr-2"></i>
              <span>
                {t("settings.2fa.disableWarning", {
                defaultValue: "Disabling 2FA will make your account less secure."
              })}
              </span>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">
                {t("settings.2fa.enterPassword", { defaultValue: "Enter your password to confirm" })}
              </label>
              <InputGroup>
                <Input
                type={showPassword ? "text" : "password"}

                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("common.password", { defaultValue: "Password" })}
                maxLength={50}
                autoFocus className="text-lg" />
              
                <InputIcon

                onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                
                  <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`}></i>
                </InputIcon>
              </InputGroup>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">
                {t("settings.2fa.enterDisableCode", { defaultValue: "Enter your 2FA code or backup code" })}
              </label>
              <Input
              type="text"
              inputMode="numeric"

              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder={t("settings.2fa.codePlaceholder", { defaultValue: "6-digit code or backup code" })}
              maxLength={20}
              autoComplete="one-time-code" className="text-lg" />
            
              {error && <div className="text-danger-500 dark:text-danger-400 mt-2">{error}</div>}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <Button type="button" onClick={handleClose} disabled={loading} variant="outline-secondary">
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="button" onClick={handleDisable} disabled={loading || !password || !totpCode} variant="danger">
              {loading ?
            <>
                  <Spinner className="w-4 h-4 mr-1 inline-block align-middle" />
                  {t("common.processing", { defaultValue: "Processing..." })}
                </> :

            t("settings.2fa.disableButton", { defaultValue: "Disable 2FA" })
            }
            </Button>
          </div>
      </div>
    </div>);

}