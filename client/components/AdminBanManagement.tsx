import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AlertCircle,
  Trash2,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { UserData } from "@/contexts/AuthContext";
import { SystemNoticesService, UserBan } from "@/lib/system-notices";
import { IPService } from "@/lib/ip-service";

interface AdminBanManagementProps {
  users: UserData[];
}

export default function AdminBanManagement({ users }: AdminBanManagementProps) {
  const [userEmailToBan, setUserEmailToBan] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"ban" | "warn">("ban");
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingBan, setSavingBan] = useState(false);
  const [ipBans, setIPBans] = useState<any[]>([]);
  const [banIPAddress, setBanIPAddress] = useState("");
  const [banIPReason, setBanIPReason] = useState("");
  const [banIPDuration, setBanIPDuration] = useState<number | null>(null);
  const [savingIPBan, setSavingIPBan] = useState(false);

  useEffect(() => {
    loadBans();
  }, []);

  const loadBans = async () => {
    try {
      setLoading(true);
      const allBans = await SystemNoticesService.getAllBans();
      setBans(allBans);

      const allIPBans = await IPService.getAllIPBans();
      setIPBans(allIPBans);
    } catch (error) {
      toast.error("Erreur lors du chargement des bans");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!userEmailToBan || !banReason) {
      toast.error("Entrez un email et une raison");
      return;
    }

    setSavingBan(true);
    try {
      const user = users.find((u) => u.email === userEmailToBan);
      if (!user) {
        toast.error("Utilisateur non trouvé");
        setSavingBan(false);
        return;
      }

      if (actionType === "ban") {
        await SystemNoticesService.banUser(
          user.uid,
          user.email,
          banReason,
          banDuration || undefined,
        );
        toast.success("Utilisateur banni avec succès");
      } else {
        await SystemNoticesService.warnUser(
          user.uid,
          user.email,
          banReason,
          banDuration || undefined,
        );
        toast.success("Utilisateur averti avec succès");
      }

      setUserEmailToBan("");
      setBanReason("");
      setBanDuration(null);
      await loadBans();
    } catch (error) {
      toast.error("Erreur lors de l'action");
    } finally {
      setSavingBan(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await SystemNoticesService.unbanUser(userId);
      toast.success("Utilisateur débanni");
      await loadBans();
    } catch (error) {
      toast.error("Erreur lors du déban");
    }
  };

  const handleBanIP = async () => {
    if (!banIPAddress || !banIPReason) {
      toast.error("Entrez une adresse IP et une raison");
      return;
    }

    setSavingIPBan(true);
    try {
      await IPService.banIP(
        banIPAddress,
        banIPReason,
        banIPDuration || undefined,
      );
      toast.success("Adresse IP bannie avec succès");

      setBanIPAddress("");
      setBanIPReason("");
      setBanIPDuration(null);
      await loadBans();
    } catch (error) {
      toast.error("Erreur lors du ban IP");
    } finally {
      setSavingIPBan(false);
    }
  };

  const handleUnbanIP = async (ipAddress: string) => {
    try {
      await IPService.unbanIP(ipAddress);
      toast.success("Adresse IP débanni");
      await loadBans();
    } catch (error) {
      toast.error("Erreur lors du déban IP");
    }
  };

  const userBans = bans.filter((b) => b.type === "ban");
  const warns = bans.filter((b) => b.type === "warn");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Ban User Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Action Type Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActionType("warn")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border ${
              actionType === "warn"
                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                : "bg-white/10 border-white/20 text-foreground/70 hover:bg-white/20"
            }`}
          >
            <AlertCircle className="inline mr-2" size={18} />
            Avertir
          </button>
          <button
            onClick={() => setActionType("ban")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border ${
              actionType === "ban"
                ? "bg-red-500/20 border-red-500/50 text-red-400"
                : "bg-white/10 border-white/20 text-foreground/70 hover:bg-white/20"
            }`}
          >
            <AlertCircle className="inline mr-2" size={18} />
            Bannir
          </button>
        </div>

        {/* Ban User Form */}
        <div
          className={`bg-gradient-to-br ${
            actionType === "ban"
              ? "from-red-500/10 to-red-500/5 border-red-500/20"
              : "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20"
          } border rounded-xl p-6`}
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertCircle
              size={20}
              className={actionType === "ban" ? "text-red-500" : "text-yellow-500"}
            />
            {actionType === "ban" ? "Bannir" : "Avertir"} un utilisateur
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                <User size={16} className="inline mr-2" />
                Email de l'utilisateur
              </label>
              <input
                list="user-emails"
                type="email"
                value={userEmailToBan}
                onChange={(e) => setUserEmailToBan(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                placeholder="user@example.com"
              />
              <datalist id="user-emails">
                {users.map((user) => (
                  <option key={user.uid} value={user.email} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                <MessageSquare size={16} className="inline mr-2" />
                Raison
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-none transition-colors"
                placeholder={
                  actionType === "ban"
                    ? "Raison du bannissement..."
                    : "Raison de l'avertissement..."
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                <Clock size={16} className="inline mr-2" />
                Durée (minutes) - Laisser vide pour permanent
              </label>
              <input
                type="number"
                min="1"
                value={banDuration || ""}
                onChange={(e) =>
                  setBanDuration(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                placeholder="ex: 1440 (24h)"
              />
            </div>

            <button
              onClick={handleBanUser}
              disabled={savingBan}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                actionType === "ban"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/50"
                  : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border-yellow-500/50"
              }`}
            >
              <AlertCircle size={18} />
              {savingBan
                ? "En cours..."
                : actionType === "ban"
                  ? "Bannir l'utilisateur"
                  : "Avertir l'utilisateur"}
            </button>
          </div>
        </div>

        {/* Ban IP Form */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-purple-500" />
            Bannir une adresse IP
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Adresse IP
              </label>
              <input
                type="text"
                value={banIPAddress}
                onChange={(e) => setBanIPAddress(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors font-mono"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Raison
              </label>
              <textarea
                value={banIPReason}
                onChange={(e) => setBanIPReason(e.target.value)}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-none transition-colors"
                placeholder="Raison du bannissement IP..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Durée (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={banIPDuration || ""}
                onChange={(e) =>
                  setBanIPDuration(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                placeholder="ex: 1440 (24h)"
              />
            </div>

            <button
              onClick={handleBanIP}
              disabled={savingIPBan}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-200 font-semibold rounded-lg border border-purple-500/50 transition-all"
            >
              <AlertCircle size={18} />
              {savingIPBan ? "En cours..." : "Bannir l'IP"}
            </button>
          </div>
        </div>
      </div>

      {/* Ban Lists Sidebar */}
      <div className="space-y-6">
        {/* Bans */}
        <div className="bg-white/5 border border-red-500/20 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-red-400 mb-4 uppercase">
            Utilisateurs Bannis ({userBans.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userBans.length === 0 ? (
              <p className="text-xs text-foreground/50">Aucun ban</p>
            ) : (
              userBans.map((ban) => (
                <div
                  key={ban.id}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  <p className="text-xs text-white font-medium truncate">
                    {ban.email}
                  </p>
                  <p className="text-xs text-red-300 mt-1 line-clamp-2">
                    {ban.reason}
                  </p>
                  {ban.expiresAt && (
                    <p className="text-xs text-foreground/50 mt-2">
                      Expire:{" "}
                      {ban.expiresAt.toDate().toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <button
                    onClick={() => handleUnbanUser(ban.userId)}
                    className="mt-2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-red-500/20 text-foreground/70 hover:text-red-300 transition-colors"
                  >
                    Débannir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warns */}
        <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-yellow-400 mb-4 uppercase">
            Avertissements ({warns.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {warns.length === 0 ? (
              <p className="text-xs text-foreground/50">
                Aucun avertissement
              </p>
            ) : (
              warns.map((warn) => (
                <div
                  key={warn.id}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
                >
                  <p className="text-xs text-white font-medium truncate">
                    {warn.email}
                  </p>
                  <p className="text-xs text-yellow-300 mt-1 line-clamp-2">
                    {warn.reason}
                  </p>
                  {warn.expiresAt && (
                    <p className="text-xs text-foreground/50 mt-2">
                      Expire:{" "}
                      {warn.expiresAt.toDate().toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* IP Bans */}
        <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-purple-400 mb-4 uppercase">
            IPs Bannies ({ipBans.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ipBans.length === 0 ? (
              <p className="text-xs text-foreground/50">Aucune IP bannie</p>
            ) : (
              ipBans.map((ban) => (
                <div
                  key={ban.id}
                  className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
                >
                  <p className="text-xs text-white font-mono font-medium truncate">
                    {ban.ipAddress}
                  </p>
                  <p className="text-xs text-purple-300 mt-1 line-clamp-2">
                    {ban.reason}
                  </p>
                  <button
                    onClick={() => handleUnbanIP(ban.ipAddress)}
                    className="mt-2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-purple-500/20 text-foreground/70 hover:text-purple-300 transition-colors"
                  >
                    Débannir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
