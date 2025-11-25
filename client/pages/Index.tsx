import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { SystemNoticeModal } from "@/components/SystemNoticeModal";
import { Menu, Loader2 } from "lucide-react";

export default function Index() {
  const { loading, userBan, maintenanceNotice } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [acknowledgedMaintenance, setAcknowledgedMaintenance] = useState(false);

  useEffect(() => {
    // If user is banned, log them out
    if (userBan) {
      signOut(auth).catch(console.error);
    }
  }, [userBan]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Show ban modal (non-dismissible, forces logout)
  if (userBan) {
    return (
      <SystemNoticeModal
        type="ban"
        title="Compte banni"
        message={`Votre compte a été banni pour la raison suivante: "${userBan.reason}"`}
        severity="critical"
        reason={userBan.reason}
        expiresAt={userBan.expiresAt ? userBan.expiresAt.toDate() : undefined}
        dismissible={false}
      />
    );
  }

  // Show maintenance modal (dismissible)
  if (maintenanceNotice && !acknowledgedMaintenance) {
    return (
      <>
        <SystemNoticeModal
          type="maintenance"
          title={maintenanceNotice.title}
          message={maintenanceNotice.message}
          severity={maintenanceNotice.severity}
          onAcknowledge={() => setAcknowledgedMaintenance(true)}
          dismissible={maintenanceNotice.severity !== "critical"}
        />
        {maintenanceNotice.severity !== "critical" && (
          <div className="flex h-screen bg-background opacity-50 pointer-events-none">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col md:flex-row">
              <ChatArea />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden border-b border-border px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu size={20} className="text-foreground" />
          </button>
        </div>

        {/* Chat Area */}
        <ChatArea />
      </div>
    </div>
  );
}
