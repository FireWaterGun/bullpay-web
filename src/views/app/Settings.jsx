import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="card">
          <div className="card-body">
            <h5 className="mb-1">{t("settings.title")}</h5>
            <small className="text-muted">{t("settings.subtitle")}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
