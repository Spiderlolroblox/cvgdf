import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { SystemNoticeModal } from "@/components/SystemNoticeModal";
import { MessageLimitModal } from "@/components/MessageLimitModal";
import { Menu, Loader2 } from "lucide-react";
import { MessagesService } from "@/lib/messages";

export default function Index() {
  const { loading, userBan, maintenanceNotice, user, userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [acknowledgedMaintenance, setAcknowledgedMaintenance] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string>();

  useEffect(() => {
    // Load first conversation if available
    if (user?.uid) {
      loadFirstConversation();
    }
  }, [user?.uid]);

  const loadFirstConversation = async () => {
    if (!user?.uid) return;
    try {
      const conversations = await MessagesService.getConversations(user.uid);
      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
      }
    } catch (error) {
      console.error("Error loading first conversation:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  };

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

  // Show message limit modal (non-dismissible)
  if (userData && userData.messagesUsed >= userData.messagesLimit) {
    return (
      <MessageLimitModal
        messagesUsed={userData.messagesUsed}
        messagesLimit={userData.messagesLimit}
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
              activeConversationId={activeConversationId}
              onConversationSelect={setActiveConversationId}
            />
            <div className="flex-1 flex flex-col md:flex-row">
              <ChatArea conversationId={activeConversationId} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeConversationId={activeConversationId}
        onConversationSelect={setActiveConversationId}
      />

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
        <ChatArea conversationId={activeConversationId} />
      </div>
    </div>
  );
}
