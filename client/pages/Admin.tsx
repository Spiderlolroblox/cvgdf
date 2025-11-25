import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Settings,
  LogOut,
  Edit2,
  Save,
  X,
  Key,
  Copy,
  Trash2,
  Brain,
  Shield,
  AlertCircle,
  Clock,
  BarChart3,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { UserData, PlanType } from "@/contexts/AuthContext";
import { getAllLicenses, deactivateLicense, LicenseKey } from "@/lib/licenses";
import { AIService, AIConfig } from "@/lib/ai";
import {
  SystemNoticesService,
  UserBan,
  MaintenanceNotice,
} from "@/lib/system-notices";
import AdminUsersList from "@/components/AdminUsersList";
import AdminBanManagement from "@/components/AdminBanManagement";
import { GenerateLicenseModal } from "@/components/GenerateLicenseModal";

export default function Admin() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "users" | "licenses" | "ai" | "system"
  >("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [bans, setBans] = useState<UserBan[]>([]);
  const [maintenanceNotices, setMaintenanceNotices] = useState<
    MaintenanceNotice[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [showGenerateLicenseModal, setShowGenerateLicenseModal] =
    useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [userEmailToBan, setUserEmailToBan] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceDuration, setMaintenanceDuration] = useState(30);
  const [maintenanceSeverity, setMaintenanceSeverity] = useState<
    "info" | "warning" | "critical"
  >("warning");
  const [savingBan, setSavingBan] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [actionType, setActionType] = useState<"ban" | "warn">("ban");

  const planLimits: Record<PlanType, number> = {
    Free: 10,
    Classic: 500,
    Pro: 1000,
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadLicenses(),
        loadAiConfig(),
        loadBans(),
        loadMaintenance(),
      ]);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadAiConfig = async () => {
    try {
      const config = await AIService.getConfig();
      setAiConfig(config);
    } catch (error) {
      console.error("Erreur lors du chargement de la config IA", error);
    }
  };

  const loadBans = async () => {
    try {
      const allBans = await SystemNoticesService.getAllBans();
      setBans(allBans);
    } catch (error) {
      console.error("Erreur lors du chargement des bans", error);
    }
  };

  const loadMaintenance = async () => {
    try {
      const notices = await SystemNoticesService.getAllMaintenanceNotices();
      setMaintenanceNotices(notices);
    } catch (error) {
      console.error("Erreur lors du chargement de la maintenance", error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            uid: doc.id,
          }) as UserData,
      );
      setUsers(usersList);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    }
  };

  const loadLicenses = async () => {
    if (!userData?.uid) return;
    try {
      const allLicenses = await getAllLicenses(userData.uid);
      setLicenses(allLicenses);
    } catch (error) {
      toast.error("Erreur lors du chargement des clés de licence");
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingId(user.uid);
    setEditData(user);
  };

  const handleSaveUser = async () => {
    if (!editingId) return;

    try {
      const userRef = doc(db, "users", editingId);
      await updateDoc(userRef, editData);

      setUsers(
        users.map((u) => (u.uid === editingId ? { ...u, ...editData } : u)),
      );

      setEditingId(null);
      toast.success("Utilisateur mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleLicenseGenerated = async () => {
    await loadLicenses();
  };

  const handleCopyLicense = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Clé copiée");
  };

  const handleDeactivateLicense = async (key: string) => {
    try {
      await deactivateLicense(key);
      await loadLicenses();
      toast.success("Clé désactivée");
    } catch (error) {
      toast.error("Erreur lors de la désactivation");
    }
  };

  const handleSaveAiConfig = async () => {
    if (!aiConfig) return;

    setSavingAiConfig(true);
    try {
      await AIService.updateConfig(aiConfig);
      toast.success("Configuration IA mise à jour");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleBanUser = async () => {
    if (!userEmailToBan || !banReason) {
      toast.error("Entrez un email et une raison");
      return;
    }

    setSavingBan(true);
    try {
      // Find user by email
      const user = users.find((u) => u.email === userEmailToBan);
      if (!user) {
        toast.error("Utilisateur non trouvé");
        return;
      }

      await SystemNoticesService.banUser(
        user.uid,
        user.email,
        banReason,
        banDuration || undefined,
      );

      toast.success("Utilisateur banni avec succ��s");
      setUserEmailToBan("");
      setBanReason("");
      setBanDuration(null);
      await loadBans();
    } catch (error) {
      toast.error("Erreur lors du ban");
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

  const handleCreateMaintenance = async () => {
    if (!maintenanceTitle || !maintenanceMessage) {
      toast.error("Entrez un titre et un message");
      return;
    }

    setSavingMaintenance(true);
    try {
      await SystemNoticesService.createMaintenanceNotice(
        maintenanceTitle,
        maintenanceMessage,
        maintenanceDuration,
        maintenanceSeverity,
      );

      toast.success("Maintenance créée");
      setMaintenanceTitle("");
      setMaintenanceMessage("");
      setMaintenanceDuration(30);
      setMaintenanceSeverity("warning");
      await loadMaintenance();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleEndMaintenance = async (noticeId: string) => {
    try {
      await SystemNoticesService.endMaintenance(noticeId);
      toast.success("Maintenance terminée");
      await loadMaintenance();
    } catch (error) {
      toast.error("Erreur lors de la terminaison");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white">Accès refusé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/30">
                <Settings size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Panneau Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-2 border-b-2 transition-all ${
                activeTab === "users"
                  ? "border-white text-white"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} />
                Utilisateurs
              </div>
            </button>
            <button
              onClick={() => setActiveTab("licenses")}
              className={`py-4 px-2 border-b-2 transition-all ${
                activeTab === "licenses"
                  ? "border-white text-white"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Key size={18} />
                Cl��s de licence
              </div>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`py-4 px-2 border-b-2 transition-all ${
                activeTab === "ai"
                  ? "border-white text-white"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain size={18} />
                Configuration IA
              </div>
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`py-4 px-2 border-b-2 transition-all ${
                activeTab === "system"
                  ? "border-white text-white"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield size={18} />
                Système
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "users" && (
          <AdminUsersList
            onBanUser={(email) => {
              setUserEmailToBan(email);
              setActiveTab("system");
            }}
            onWarnUser={(email) => {
              setUserEmailToBan(email);
              setActionType("warn");
              setActiveTab("system");
            }}
          />
        )}

        {activeTab === "licenses" && (
          <>
            {/* Generate License Button */}
            <div className="mb-8">
              <button
                onClick={() => setShowGenerateLicenseModal(true)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg border border-white/40 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Générer une nouvelle clé
              </button>
            </div>

            {/* Licenses Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Key size={20} />
                  Clés générées ({licenses.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-foreground/60">Chargement des clés...</p>
                </div>
              ) : licenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-foreground/60">Aucune clé générée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10 bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Clé
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Expire le
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Utilisée par
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Date création
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses
                        .filter((license) => license && license.key)
                        .map((license) => (
                          <tr
                            key={`license-${license.key}`}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <code className="text-white/80 text-sm font-mono bg-white/5 px-2 py-1 rounded">
                                {license.key.substring(0, 20)}...
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-foreground/70">
                                {license.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  license.active
                                    ? "text-green-400 font-semibold"
                                    : "text-red-400 font-semibold"
                                }
                              >
                                {license.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-foreground/70 text-sm">
                                {license.expiresAt && !isNaN(license.expiresAt)
                                  ? new Date(
                                      license.expiresAt,
                                    ).toLocaleDateString()
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-foreground/70">
                                {license.usedBy &&
                                typeof license.usedBy === "string"
                                  ? `${license.usedBy.substring(0, 8)}...`
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-foreground/70 text-sm">
                                {license.createdAt && !isNaN(license.createdAt)
                                  ? new Date(
                                      license.createdAt,
                                    ).toLocaleDateString()
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopyLicense(license.key)}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                  title="Copier"
                                >
                                  <Copy size={16} />
                                </button>
                                {license.active && (
                                  <button
                                    onClick={() =>
                                      handleDeactivateLicense(license.key)
                                    }
                                    className="p-2 bg-white/10 hover:bg-red-500/20 rounded text-white hover:text-red-400 transition-colors"
                                    title="Désactiver"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "ai" && (
          <>
            {/* AI Configuration Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Model and Temperature */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Brain size={20} />
                  Paramètres du modèle
                </h3>

                <div className="space-y-5">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Modèle
                    </label>
                    <input
                      type="text"
                      value={aiConfig?.model || ""}
                      onChange={(e) =>
                        setAiConfig(
                          aiConfig
                            ? { ...aiConfig, model: e.target.value }
                            : null,
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40"
                      placeholder="ex: x-ai/grok-4.1-fast:free"
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      Entrez le nom du modèle OpenRouter
                    </p>
                  </div>

                  {/* Temperature Slider */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Température: {aiConfig?.temperature.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={aiConfig?.temperature || 0.7}
                      onChange={(e) =>
                        setAiConfig(
                          aiConfig
                            ? {
                                ...aiConfig,
                                temperature: parseFloat(e.target.value),
                              }
                            : null,
                        )
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-foreground/50 mt-1">
                      0 = déterministe, 2 = très créatif
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Tokens max
                    </label>
                    <input
                      type="number"
                      min="128"
                      max="4096"
                      value={aiConfig?.maxTokens || 2048}
                      onChange={(e) =>
                        setAiConfig(
                          aiConfig
                            ? {
                                ...aiConfig,
                                maxTokens: parseInt(e.target.value, 10),
                              }
                            : null,
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Settings size={20} />
                  Prompt système
                </h3>

                <div className="space-y-5">
                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Instructions de l'IA
                    </label>
                    <textarea
                      value={aiConfig?.systemPrompt || ""}
                      onChange={(e) =>
                        setAiConfig(
                          aiConfig
                            ? { ...aiConfig, systemPrompt: e.target.value }
                            : null,
                        )
                      }
                      rows={7}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-none"
                      placeholder="Entrez les instructions pour l'IA..."
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      Les instructions définissent le comportement et le style
                      de l'IA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveAiConfig}
                disabled={savingAiConfig}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-semibold rounded-lg border border-white/40 transition-all"
              >
                <Save size={18} />
                {savingAiConfig ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </>
        )}

        {activeTab === "system" && (
          <>
            <AdminBanManagement users={users} />

            {/* Maintenance Mode Section */}
            <div className="mt-8 bg-white/5 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Clock size={20} className="text-yellow-500" />
                Mode maintenance
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={maintenanceTitle}
                      onChange={(e) => setMaintenanceTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                      placeholder="ex: Mise à jour système"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Message
                    </label>
                    <textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40 resize-none"
                      placeholder="Entrez le message de maintenance..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maintenanceDuration}
                      onChange={(e) =>
                        setMaintenanceDuration(parseInt(e.target.value, 10))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Sévérité
                    </label>
                    <select
                      value={maintenanceSeverity}
                      onChange={(e) =>
                        setMaintenanceSeverity(
                          e.target.value as "info" | "warning" | "critical",
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="info">Information</option>
                      <option value="warning">Avertissement</option>
                      <option value="critical">Critique (bloque l'app)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreateMaintenance}
                    disabled={savingMaintenance}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 text-yellow-200 font-semibold rounded-lg border border-yellow-500/50 transition-all"
                  >
                    <Clock size={18} />
                    {savingMaintenance ? "Création..." : "Démarrer maintenance"}
                  </button>
                </div>

                {/* Active Maintenance */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">
                    Maintenances actives (
                    {maintenanceNotices.filter((n) => n.isActive).length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {maintenanceNotices.filter((n) => n.isActive).length ===
                    0 ? (
                      <p className="text-xs text-foreground/50">
                        Pas de maintenance en cours
                      </p>
                    ) : (
                      maintenanceNotices
                        .filter((n) => n.isActive)
                        .map((notice) => (
                          <div
                            key={notice.id}
                            className="bg-white/5 border border-yellow-500/20 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium">
                                  {notice.title}
                                </p>
                                <p className="text-xs text-foreground/50 mt-1 truncate">
                                  {notice.message}
                                </p>
                                <p
                                  className={`text-xs font-semibold mt-2 ${
                                    notice.severity === "critical"
                                      ? "text-red-400"
                                      : notice.severity === "warning"
                                        ? "text-yellow-400"
                                        : "text-blue-400"
                                  }`}
                                >
                                  {notice.severity === "critical"
                                    ? "CRITIQUE"
                                    : ""}
                                  {notice.severity === "warning"
                                    ? "AVERTISSEMENT"
                                    : ""}
                                  {notice.severity === "info" ? "INFO" : ""}
                                </p>
                              </div>
                              <button
                                onClick={() => handleEndMaintenance(notice.id)}
                                className="ml-2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-foreground transition-colors"
                              >
                                Terminer
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Generate License Modal */}
      {userData && (
        <GenerateLicenseModal
          isOpen={showGenerateLicenseModal}
          onClose={() => setShowGenerateLicenseModal(false)}
          adminUid={userData.uid}
          onLicenseGenerated={handleLicenseGenerated}
        />
      )}
    </div>
  );
}
