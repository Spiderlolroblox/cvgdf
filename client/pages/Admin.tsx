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
} from "lucide-react";
import { toast } from "sonner";
import { UserData, PlanType } from "@/contexts/AuthContext";
import {
  generateLicenseKey,
  getAllLicenses,
  deactivateLicense,
  LicenseKey,
} from "@/lib/licenses";
import { AIService, AIConfig } from "@/lib/ai";
import {
  SystemNoticesService,
  UserBan,
  MaintenanceNotice,
} from "@/lib/system-notices";

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
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [selectedPlanForGeneration, setSelectedPlanForGeneration] =
    useState<PlanType>("Classic");
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

  const planLimits: Record<PlanType, number> = {
    Free: 10,
    Classic: 50,
    Pro: 999,
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
      const usersList = snapshot.docs.map((doc) => doc.data() as UserData);
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

  const handleGenerateLicense = async () => {
    if (!userData?.uid) return;

    setGeneratingLicense(true);
    try {
      const newKey = await generateLicenseKey(
        selectedPlanForGeneration,
        userData.uid,
      );
      await loadLicenses();
      toast.success(`Clé générée: ${newKey}`);
    } catch (error) {
      toast.error("Erreur lors de la génération de la clé");
    } finally {
      setGeneratingLicense(false);
    }
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

      toast.success("Utilisateur banni avec succès");
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
                Clés de licence
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
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className="text-white/60" />
                  <span className="text-foreground/60 text-sm">
                    Utilisateurs Total
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {users.length || 0}
                </p>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Settings size={20} className="text-white/60" />
                  <span className="text-foreground/60 text-sm">
                    Plans Premium
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {users.filter((u) => u.plan !== "Free").length || 0}
                </p>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className="text-white/60" />
                  <span className="text-foreground/60 text-sm">
                    Messages Utilisés
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {users.reduce((sum, u) => sum + (u.messagesUsed || 0), 0)}
                </p>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users size={20} />
                  Gestion des Utilisateurs
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-foreground/60">
                    Chargement des utilisateurs...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10 bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Messages
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground/70">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((user) => user && user.uid)
                        .map((user) => (
                          <tr
                            key={`user-${user.uid}`}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="text-white">{user.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              {editingId === user.uid ? (
                                <select
                                  value={
                                    editData.plan !== undefined
                                      ? editData.plan
                                      : user.plan || "Free"
                                  }
                                  onChange={(e) => {
                                    const plan = e.target.value as PlanType;
                                    setEditData({
                                      ...editData,
                                      plan,
                                      messagesLimit: planLimits[plan],
                                    });
                                  }}
                                  className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                                >
                                  <option value="Free">Free</option>
                                  <option value="Classic">Classic</option>
                                  <option value="Pro">Pro</option>
                                </select>
                              ) : (
                                <span className="text-foreground/70">
                                  {user.plan}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingId === user.uid ? (
                                <input
                                  type="number"
                                  value={
                                    editData.messagesUsed !== undefined
                                      ? editData.messagesUsed
                                      : user.messagesUsed || 0
                                  }
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      messagesUsed:
                                        parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm w-20"
                                />
                              ) : (
                                <span className="text-foreground/70">
                                  {user.messagesUsed} / {user.messagesLimit}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingId === user.uid ? (
                                <input
                                  type="checkbox"
                                  checked={
                                    editData.isAdmin !== undefined
                                      ? editData.isAdmin
                                      : user.isAdmin || false
                                  }
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      isAdmin: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4"
                                />
                              ) : (
                                <span
                                  className={
                                    user.isAdmin
                                      ? "text-white font-semibold"
                                      : "text-foreground/70"
                                  }
                                >
                                  {user.isAdmin ? "Oui" : "Non"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingId === user.uid ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveUser}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
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

        {activeTab === "licenses" && (
          <>
            {/* License Generation Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Key size={20} />
                Générer une nouvelle clé
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedPlanForGeneration}
                  onChange={(e) =>
                    setSelectedPlanForGeneration(e.target.value as PlanType)
                  }
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                >
                  <option value="Free">Free</option>
                  <option value="Classic">Classic</option>
                  <option value="Pro">Pro</option>
                </select>

                <button
                  onClick={handleGenerateLicense}
                  disabled={generatingLicense}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-semibold rounded-lg border border-white/40 transition-all"
                >
                  {generatingLicense ? "Génération..." : "Générer"}
                </button>
              </div>
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

              {/* System Prompt and API Key */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Settings size={20} />
                  Configuration avancée
                </h3>

                <div className="space-y-5">
                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Prompt système
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
                      rows={5}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-none"
                      placeholder="Entrez les instructions pour l'IA..."
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Clé API OpenRouter
                    </label>
                    <input
                      type="password"
                      value={aiConfig?.apiKey || ""}
                      onChange={(e) =>
                        setAiConfig(
                          aiConfig
                            ? { ...aiConfig, apiKey: e.target.value }
                            : null,
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                      placeholder="sk-or-..."
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      Votre clé API restera sécurisée
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
            {/* System Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ban Users */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" />
                  Bannir un utilisateur
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Email de l'utilisateur
                    </label>
                    <input
                      type="email"
                      value={userEmailToBan}
                      onChange={(e) => setUserEmailToBan(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Raison du ban
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40 resize-none"
                      placeholder="Entrez la raison..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
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
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                      placeholder="ex: 1440 (24h)"
                    />
                  </div>

                  <button
                    onClick={handleBanUser}
                    disabled={savingBan}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-200 font-semibold rounded-lg border border-red-500/50 transition-all"
                  >
                    <AlertCircle size={18} />
                    {savingBan ? "Bannissement..." : "Bannir l'utilisateur"}
                  </button>
                </div>

                {/* Active Bans */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Utilisateurs bannis
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bans.length === 0 ? (
                      <p className="text-xs text-foreground/50">
                        Aucun ban actif
                      </p>
                    ) : (
                      bans.map((ban) => (
                        <div
                          key={ban.id}
                          className="bg-white/5 border border-red-500/20 rounded-lg p-3 flex justify-between items-start"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {ban.email}
                            </p>
                            <p className="text-xs text-red-400 truncate">
                              {ban.reason}
                            </p>
                            {ban.expiresAt && (
                              <p className="text-xs text-foreground/50 mt-1">
                                Expire:{" "}
                                {ban.expiresAt
                                  .toDate()
                                  .toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </p>
                            )}
                            {ban.isPermanent && (
                              <p className="text-xs text-red-500 font-semibold mt-1">
                                PERMANENT
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnbanUser(ban.userId)}
                            className="ml-2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-foreground transition-colors"
                          >
                            Débannir
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-yellow-500" />
                  Mode maintenance
                </h3>

                <div className="space-y-4 mb-6">
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 text-yellow-200 font-semibold rounded-lg border border-yellow-500/50 transition-all"
                  >
                    <Clock size={18} />
                    {savingMaintenance ? "Création..." : "Démarrer maintenance"}
                  </button>
                </div>

                {/* Active Maintenance */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Maintenances actives
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
    </div>
  );
}
