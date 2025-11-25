import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Connecté avec succès!");
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de connexion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
          <p className="text-foreground/60">Connectez-vous à votre compte</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 animate-slideUp">
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

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all border border-white/40 hover:border-white/60 mt-6"
          >
            {loading ? "Connexion en cours..." : "Se Connecter"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-foreground/50 text-sm">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-foreground/60 text-sm mb-3">
            Pas encore de compte?
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 border border-white/40 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Créer un compte
          </Link>
        </div>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-xs text-foreground/50">
            <span className="font-semibold text-white">Demo:</span> Créez un
            nouveau compte pour commencer
          </p>
        </div>
      </div>
    </div>
  );
}
