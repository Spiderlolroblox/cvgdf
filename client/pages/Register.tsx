import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PlanType, UserData } from "@/contexts/AuthContext";
import { Mail, Lock, UserPlus, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { IPService } from "@/lib/ip-service";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateLicenseKey = async (
    key: string,
  ): Promise<{ valid: boolean; plan?: PlanType }> => {
    if (!key.trim()) {
      return { valid: false };
    }

    try {
      const licenseDoc = await getDoc(doc(db, "licenses", key));

      if (!licenseDoc.exists()) {
        return { valid: false };
      }

      const licenseData = licenseDoc.data();

      if (!licenseData.active) {
        return { valid: false };
      }

      return { valid: true, plan: licenseData.plan as PlanType };
    } catch (error) {
      return { valid: false };
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // Get user's IP address
      const userIP = await IPService.getUserIP();

      // Check IP ban
      const ipBan = await IPService.checkIPBan(userIP);
      if (ipBan) {
        toast.error(
          "Votre adresse IP est bannie: " +
            ipBan.reason +
            (ipBan.expiresAt
              ? " (Expire le " +
                ipBan.expiresAt.toDate().toLocaleDateString() +
                ")"
              : " (Permanent)"),
        );
        setLoading(false);
        return;
      }

      // Check account limit per IP (max 1 account)
      const ipCheck = await IPService.checkIPLimit(userIP, 1);
      if (ipCheck.isLimitExceeded) {
        toast.error(
          "Vous avez atteint le nombre maximal de comptes autorisés depuis votre adresse IP",
        );
        setLoading(false);
        return;
      }

      let planToUse: PlanType = "Free";

      if (licenseKey.trim()) {
        const licenseValidation = await validateLicenseKey(licenseKey);

        if (!licenseValidation.valid) {
          toast.error("Clé de licence invalide ou inactive");
          setLoading(false);
          return;
        }

        if (licenseValidation.plan) {
          planToUse = licenseValidation.plan;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const planLimits: Record<PlanType, number> = {
        Free: 10,
        Classic: 50,
        Pro: 999,
      };

      const userData: UserData = {
        uid: user.uid,
        email: user.email || "",
        displayName: email.split("@")[0],
        plan: planToUse,
        role: "user",
        category: "individual",
        messagesUsed: 0,
        messagesLimit: planLimits[planToUse],
        createdAt: Date.now(),
        isAdmin: false,
      };

      // Only add licenseKey if it was provided
      if (licenseKey.trim()) {
        (userData as any).licenseKey = licenseKey.trim();
      }

      // Create user document in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), userData);
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        throw new Error(
          "Impossible de créer le profil utilisateur. Veuillez réessayer.",
        );
      }

      // Record user IP (non-critical, don't block registration)
      try {
        await IPService.recordUserIP(user.uid, user.email || "", userIP);
      } catch (ipError) {
        console.error("IP recording error (non-critical):", ipError);
      }

      toast.success("Compte créé avec succès!");
      navigate("/");
    } catch (error) {
      let message = "Erreur d'inscription";

      if (error && typeof error === "object") {
        const firebaseError = error as { code?: string; message?: string };

        // Map Firebase error codes to user-friendly messages
        const errorMap: Record<string, string> = {
          "auth/email-already-in-use": "Cet email est déjà utilisé",
          "auth/invalid-email": "Email invalide",
          "auth/weak-password":
            "Le mot de passe doit contenir au moins 6 caractères",
          "auth/operation-not-allowed": "L'inscription n'est pas autorisée",
          "auth/network-request-failed":
            "Erreur de connexion réseau. Vérifiez votre connexion internet.",
        };

        if (firebaseError.code) {
          message = errorMap[firebaseError.code] || firebaseError.code;
        } else if (firebaseError.message) {
          // Handle cases where Firebase returns a message instead of code
          if (firebaseError.message.includes("EMAIL_EXISTS")) {
            message = "Cet email est déjà utilisé";
          } else if (firebaseError.message.includes("WEAK_PASSWORD")) {
            message = "Le mot de passe doit contenir au moins 6 caractères";
          } else if (firebaseError.message.includes("INVALID_EMAIL")) {
            message = "Email invalide";
          } else {
            message = firebaseError.message;
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/30">
              <UserPlus size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Créez votre compte
          </h1>
          <p className="text-foreground/60">Inscrivez-vous pour commencer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 animate-slideUp">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-3 text-foreground/40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-foreground/40 focus:outline-none focus:border-white/60 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-3 text-foreground/40"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-foreground/40 focus:outline-none focus:border-white/60 transition-colors"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-3 text-foreground/40"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-foreground/40 focus:outline-none focus:border-white/60 transition-colors"
                required
              />
            </div>
          </div>

          {/* License Key */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Clé de licence (optionnel)
            </label>
            <div className="relative">
              <Key
                size={18}
                className="absolute left-3 top-3 text-foreground/40"
              />
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Entrez votre clé de licence"
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-foreground/40 focus:outline-none focus:border-white/60 transition-colors"
              />
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              Si vous n'avez pas de clé, un compte gratuit sera créé
            </p>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all border border-white/40 hover:border-white/60 mt-6"
          >
            {loading ? "Inscription en cours..." : "Créer un compte"}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-foreground/60 text-sm mb-3">
            Vous avez déjà un compte?
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 border border-white/40 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Se Connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
