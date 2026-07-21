import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "../../context/I18nContext";

const DISMISS_KEY = "talenthub_install_dismissed_at";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function wasDismissed() {
  return localStorage.getItem(DISMISS_KEY) !== null;
}

export default function InstallPrompt() {
  const { t } = useT();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIos()) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed bottom-32 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white rounded-xl border border-border shadow-lg p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-[10px]">TH</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">{t("installPrompt.title")}</div>
          {deferredPrompt ? (
            <>
              <p className="text-xs text-ink-3 mt-0.5 mb-2.5">{t("installPrompt.description")}</p>
              <button onClick={install} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90 transition-colors">
                <Download className="w-3.5 h-3.5" /> {t("installPrompt.install")}
              </button>
            </>
          ) : (
            <p className="text-xs text-ink-3 mt-0.5 flex items-center gap-1 flex-wrap">
              <Share className="w-3.5 h-3.5 flex-shrink-0" /> {t("installPrompt.iosHint")}
            </p>
          )}
        </div>
        <button onClick={dismiss} className="p-1 text-ink-3 hover:text-ink flex-shrink-0" title={t("common.close")}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
