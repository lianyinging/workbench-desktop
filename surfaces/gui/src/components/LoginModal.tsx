import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { loginWithPassword } from "../localAuth";
import { Icon } from "./Icon";
import appLogo from "../assets/logo.png";

const INPUT =
  "w-full h-10 px-3 rounded-lg border border-line bg-paper text-body text-ink placeholder:text-placeholder outline-none focus:border-accent";

export function LoginModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: (username: string) => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) {
      setError(t("login.error_username"));
      return;
    }
    if (!password) {
      setError(t("login.error_password"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const account = await loginWithPassword(u, password);
      onSignedIn(account.nickName || account.username);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("login.error_failed");
      setError(msg || t("login.error_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50" data-testid="login-modal">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="login-modal-title"
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <img src={appLogo} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          <div className="min-w-0 flex-1">
            <div id="login-modal-title" className="text-body font-semibold text-ink">
              {t("login.title")}
            </div>
            <div className="text-meta text-muted">{t("login.subtitle")}</div>
          </div>
          <button
            type="button"
            className="text-faint hover:text-ink shrink-0"
            onClick={onClose}
            aria-label={t("login.close")}
            data-testid="login-modal-close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form className="px-5 pb-5 space-y-3" onSubmit={submit}>
          <label className="block">
            <span className="block text-meta text-muted mb-1">{t("login.username")}</span>
            <input
              ref={userRef}
              className={INPUT}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.username_placeholder")}
              autoComplete="username"
              data-testid="login-username"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="block text-meta text-muted mb-1">{t("login.password")}</span>
            <div className="relative">
              <input
                className={INPUT + " pr-10"}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.password_placeholder")}
                autoComplete="current-password"
                data-testid="login-password"
                disabled={busy}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-faint hover:text-ink disabled:opacity-50"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
                data-testid="login-password-toggle"
                disabled={busy}
                tabIndex={-1}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </label>

          {error && (
            <div className="text-meta text-danger" data-testid="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-10 rounded-lg bg-accent text-white text-ui font-semibold hover:opacity-95 disabled:opacity-50"
            disabled={busy}
            data-testid="login-submit"
          >
            {busy ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
