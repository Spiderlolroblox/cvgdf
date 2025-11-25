import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PlanType, UserData } from "@/contexts/AuthContext";
import { Mail, Lock, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    price: "0€",
    messages: 10,
    features: [
      "10 messages/mois",
      "Conversations illimitées",
      "Support basique",
    ],
  },
  {
    name: "Classic",
    price: "9€",
    messages: 50,
    features: [
      "50 messages/mois",
      "Conversations illimitées",
      "Support prioritaire",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "19€",
    messages: 999,
    features: [
      "Messages illimités",
      "Conversations illimitées",
      "Support 24/7",
    ],
  },
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("Free");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
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
        plan: selectedPlan,
        messagesUsed: 0,
        messagesLimit: planLimits[selectedPlan],
        createdAt: Date.now(),
        isAdmin: false,
      };

      await setDoc(doc(db, "users", user.uid), userData);

      toast.success("Compte créé avec succès!");
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur d'inscription";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/30">
              <UserPlus size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Créez votre compte
          </h1>
          <p className="text-foreground/60">Choisissez un plan et commencez</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Plans */}
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name as PlanType)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedPlan === plan.name
                  ? "border-white bg-white/10"
                  : "border-white/20 hover:border-white/40"
              } ${plan.popular ? "lg:scale-105 lg:z-10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 border border-white/40 px-4 py-1 rounded-full text-xs font-semibold text-white">
                  Populaire
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-foreground/60 text-sm">/mois</span>
              </div>
              <div className="text-white font-semibold mb-4">
                {plan.messages} messages
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-foreground/80 text-sm"
                  >
                    <Check size={16} className="text-white/60" />
                    {feature}
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.name && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Check size={16} className="text-background" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
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
    </div>
  );
}
