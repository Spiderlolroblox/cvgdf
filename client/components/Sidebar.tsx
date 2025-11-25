import { Plus, LogOut, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SettingsModal } from "@/components/SettingsModal";
import { HelpModal } from "@/components/HelpModal";

interface Conversation {
  id: number;
  name: string;
  active: boolean;
  isDeleting?: boolean;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type PlanType = "Free" | "Classic" | "Pro";

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, name: "Nouvelle conversation", active: true },
  ]);
  const [messagesUsed] = useState(7);
  const [messagesLimit] = useState(15);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentPlan] = useState<PlanType>("Pro");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNewConversation = () => {
    const newId = Math.max(...conversations.map((c) => c.id), 0) + 1;
    const newConversation: Conversation = {
      id: newId,
      name: `Conversation ${newId}`,
      active: true,
    };
    setConversations([...conversations, newConversation]);
  };

  const handleDeleteConversation = (id: number) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, isDeleting: true } : c)),
    );
    setTimeout(() => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setEditingId(null);
    }, 300);
  };

  const handleEditConversation = (id: number, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      setConversations(
        conversations.map((c) =>
          c.id === editingId ? { ...c, name: editName } : c,
        ),
      );
    }
    setIsDialogOpen(false);
    setEditingId(null);
    setEditName("");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-sidebar border-r-2 border-white/20 flex flex-col transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-50 animate-slideInLeft`}
      >
        {/* Header - Minimal */}
        <div className="p-4 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center text-background text-sm font-bold border-2 border-white hover:scale-110 transition-transform">
                U
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Utilisateur</p>
                <p className="text-xs text-white/50 font-medium">
                  {currentPlan}
                </p>
              </div>
            </div>
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-foreground/70 hover:text-foreground">
                  <MoreVertical size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2 bg-card border-2 border-white rounded-xl">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsHelpOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    Help
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-xs text-foreground/50 truncate">
            nothing@example.com
          </p>
        </div>

        {/* Divider */}
        <div className="px-4 py-0">
          <div className="h-px bg-white/10"></div>
        </div>

        {/* New Conversation Button - Discreet */}
        <div
          className="px-4 py-2 animate-fadeIn"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-white/40 text-foreground/70 hover:border-white/70 hover:text-foreground hover:bg-white/5 transition-all text-xs font-medium rounded-lg"
          >
            <Plus size={14} />
            New conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {conversations.map((conv, idx) => (
              <div
                key={conv.id}
                className="group transition-all duration-300"
                style={{
                  animationDelay: `${0.2 + idx * 0.05}s`,
                  opacity: conv.isDeleting ? 0 : 1,
                  transform: conv.isDeleting
                    ? "translateX(-10px)"
                    : "translateX(0)",
                }}
              >
                <div
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg border-2 transition-all ${
                    conv.active
                      ? "bg-white/10 border-white"
                      : "border-white/30 hover:border-white/60"
                  }`}
                >
                  <button
                    onClick={() =>
                      setConversations(
                        conversations.map((c) => ({
                          ...c,
                          active: c.id === conv.id,
                        })),
                      )
                    }
                    className={`flex-1 text-left text-sm transition-all py-1 px-2 rounded ${
                      conv.active
                        ? "text-foreground"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {conv.name}
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditConversation(conv.id, conv.name)}
                      className="p-1 text-foreground/70 hover:text-foreground hover:bg-white/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(conv.id)}
                      className="p-1 text-foreground/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Usage Section */}
        <div
          className="px-4 py-4 border-t border-white/10 animate-fadeIn"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-white/70 font-medium">Messages</span>
          </div>
          <div className="space-y-1">
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full transition-all"
                style={{ width: `${(messagesUsed / messagesLimit) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-white/60">
              {messagesLimit - messagesUsed} of {messagesLimit} remaining
            </p>
          </div>
        </div>

        {/* Footer - Sign Out */}
        <div
          className="px-4 py-3 border-t border-white/10 animate-fadeIn"
          style={{ animationDelay: "0.3s" }}
        >
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-foreground/70 hover:text-foreground border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 transition-all text-xs font-medium rounded-lg hover:scale-105 transform">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Edit Conversation Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-2 border-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Conversation name..."
              className="w-full bg-background border border-white/30 rounded-lg px-4 py-2 text-foreground placeholder-foreground/40 focus:outline-none focus:border-white transition-colors"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSaveEdit();
                }
              }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 text-foreground/70 border border-white/30 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-white/20 text-foreground border border-white rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </>
  );
}
