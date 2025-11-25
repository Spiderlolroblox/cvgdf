import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SystemNoticeModalProps {
  type: "ban" | "maintenance";
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical";
  reason?: string;
  expiresAt?: Date;
  onAcknowledge?: () => void;
  dismissible?: boolean;
}

export function SystemNoticeModal({
  type,
  title,
  message,
  severity = "warning",
  reason,
  expiresAt,
  onAcknowledge,
  dismissible = false,
}: SystemNoticeModalProps) {
  const getSeverityIcon = () => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "info":
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "info":
        return "border-blue-500/30 bg-blue-500/5";
    }
  };

  const getButtonColor = () => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-200";
      case "warning":
        return "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-200";
      case "info":
        return "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-md rounded-xl border ${getSeverityColor()} animate-slideUp`}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {getSeverityIcon()}
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
              {type === "ban" && (
                <p className="text-sm text-red-400/80">
                  Votre compte a été banni
                </p>
              )}
              {type === "maintenance" && (
                <p className="text-sm text-yellow-400/80">
                  Maintenance en cours
                </p>
              )}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={onAcknowledge}
              className="text-foreground/50 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-foreground/80 leading-relaxed">{message}</p>

          {reason && type === "ban" && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-foreground/50 mb-1">Raison:</p>
              <p className="text-sm text-foreground/70">{reason}</p>
            </div>
          )}

          {expiresAt && type === "ban" && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-foreground/50 mb-1">Expiration:</p>
              <p className="text-sm text-foreground/70">
                {expiresAt.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {type === "maintenance" && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-foreground/50 mb-1">Impact:</p>
              <p className="text-sm text-foreground/70">
                {severity === "critical"
                  ? "L'application est partiellement indisponible"
                  : "Certaines fonctionnalités peuvent être limitées"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/10">
          {type === "ban" && (
            <div className="text-center">
              <p className="text-xs text-foreground/50 mb-3">
                Veuillez contacter le support pour plus d'informations
              </p>
              <button
                disabled
                className="w-full py-2 rounded-lg bg-white/10 text-white/50 cursor-not-allowed font-semibold"
              >
                Compte banni
              </button>
            </div>
          )}

          {type === "maintenance" && (
            <button
              onClick={onAcknowledge}
              className={`w-full py-2 rounded-lg font-semibold border transition-all ${getButtonColor()}`}
            >
              {dismissible ? "J'ai compris" : "D'accord"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
