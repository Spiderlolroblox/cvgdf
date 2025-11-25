import { useState } from "react";
import { Key, Check, AlertCircle } from "lucide-react";
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
      <DialogContent className="bg-card border-2 border-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Key size={24} className="text-white/60" />
            Activer une Licence
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              Licence activée!
            </p>
            <p className="text-sm text-foreground/60 text-center">
              Votre plan a été mis à jour. Vous pouvez continuer à utiliser l'IA.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Clé de licence
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Entrez votre clé de licence..."
                className="w-full bg-background border border-white/20 rounded-lg px-4 py-3 text-foreground placeholder-foreground/40 focus:outline-none focus:border-white transition-colors font-mono"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleActivate();
                  }
                }}
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle
                  size={18}
                  className="text-white/60 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-foreground/60">
                  Vous n'avez pas de clé? Contactez l'administrateur pour obtenir
                  une licence.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-foreground/70 border border-white/30 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleActivate}
                disabled={loading || !licenseKey.trim()}
                className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-foreground font-semibold rounded-lg border border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Activation..." : "Activer"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
