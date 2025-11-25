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
import { Users, Settings, LogOut, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { UserData, PlanType } from "@/contexts/AuthContext";

export default function Admin() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserData>>({});

  const planLimits: Record<PlanType, number> = {
    Free: 10,
    Classic: 50,
    Pro: 999,
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map((doc) => doc.data() as UserData);
      setUsers(usersList);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-white/60" />
              <span className="text-foreground/60 text-sm">
                Utilisateurs Total
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Settings size={20} className="text-white/60" />
              <span className="text-foreground/60 text-sm">Plans Premium</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter((u) => u.plan !== "Free").length}
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
              {users.reduce((sum, u) => sum + u.messagesUsed, 0)}
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
                  {users.map((user) =>
                    editingId === user.uid ? (
                      <tr
                        key={user.uid}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editData.plan || user.plan}
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
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editData.messagesUsed ?? user.messagesUsed}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                messagesUsed: parseInt(e.target.value),
                              })
                            }
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm w-20"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={editData.isAdmin ?? user.isAdmin}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                isAdmin: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={user.uid}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-foreground/70">
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-foreground/70">
                            {user.messagesUsed} / {user.messagesLimit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              user.isAdmin
                                ? "text-white font-semibold"
                                : "text-foreground/70"
                            }
                          >
                            {user.isAdmin ? "Oui" : "Non"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
