import { useState } from "react";
import { Key, Check, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LicenseActivationModal({
  isOpen,
  onClose,
}: LicenseActivationModalProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error("Entrez une clé de licence");
      return;
    }

    setLoading(true);
    try {
      // Call your license activation API
      const response = await fetch("/api/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Clé de licence invalide");
        return;
      }

      setSuccess(true);
      toast.success("Licence activée avec succès!");
      setTimeout(() => {
        onClose();
        setLicenseKey("");
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error activating license:", error);
      toast.error("Erreur lors de l'activation de la licence");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-0 rounded-2xl overflow-hidden p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

        {success ? (
          <div className="relative z-10 flex flex-col items-center justify-center py-12 px-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-full flex items-center justify-center animate-bounce border border-green-500/30">
                <Check size={40} className="text-green-400" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-white">
                Licence activée!
              </p>
              <p className="text-sm text-slate-300">
                Votre plan a été mis à jour avec succès.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Vous pouvez continuer à utiliser l'IA sans limites.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-6 p-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-lg border border-blue-400/30">
                  <Key size={20} className="text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Activer une Licence
                </h2>
              </div>
              <p className="text-sm text-slate-400 ml-10">
                Entrez votre clé de licence pour accéder à toutes les fonctionnalités
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-300 mb-2 block">
                  Clé de licence
                </span>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="ex: VIA-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm backdrop-blur-sm"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleActivate();
                    }
                  }}
                />
              </label>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
              <div className="flex gap-3">
                <AlertCircle
                  size={18}
                  className="text-amber-400/70 flex-shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-200">
                    Vous n'avez pas de clé?
                  </p>
                  <p className="text-xs text-amber-100/70">
                    Contactez l'administrateur pour obtenir une licence
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 text-slate-300 border border-slate-600 rounded-xl hover:bg-slate-700/50 hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleActivate}
                disabled={loading || !licenseKey.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activation...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Activer
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
