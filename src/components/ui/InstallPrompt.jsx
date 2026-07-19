import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "talenthub_install_dismissed_at";
const DISMISS_DAYS = 14;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function recentlyDismissed() {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

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
    <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-80 z-40">
      <div className="bg-white rounded-xl border border-border shadow-lg p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-[10px]">TH</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">TalentHub'ni o'rnating</div>
          {deferredPrompt ? (
            <>
              <p className="text-xs text-ink-3 mt-0.5 mb-2.5">Ilovani telefon ekraningizga qo'shib, tezroq kirishingiz mumkin</p>
              <button onClick={install} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90 transition-colors">
                <Download className="w-3.5 h-3.5" /> O'rnatish
              </button>
            </>
          ) : (
            <p className="text-xs text-ink-3 mt-0.5 flex items-center gap-1 flex-wrap">
              <Share className="w-3.5 h-3.5 flex-shrink-0" /> Ulashish tugmasi → "Bosh ekranga qo'shish"
            </p>
          )}
        </div>
        <button onClick={dismiss} className="p-1 text-ink-3 hover:text-ink flex-shrink-0" title="Yopish">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
