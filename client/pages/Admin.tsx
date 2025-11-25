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
} from "lucide-react";
import { toast } from "sonner";
import { UserData, PlanType } from "@/contexts/AuthContext";
import {
  generateLicenseKey,
  getAllLicenses,
  deactivateLicense,
  LicenseKey,
} from "@/lib/licenses";

export default function Admin() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"users" | "licenses">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [selectedPlanForGeneration, setSelectedPlanForGeneration] =
    useState<PlanType>("Classic");

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
      await Promise.all([loadUsers(), loadLicenses()]);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
}
