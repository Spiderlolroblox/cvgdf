import { Send, Smile, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessagesService, Message } from "@/lib/messages";
import { AIService } from "@/lib/ai";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😢",
  "😡",
  "🎉",
  "🔥",
  "👍",
  "❤️",
  "✨",
  "🚀",
  "💯",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function ChatArea() {
  const { user, userData } = useAuth();
  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !user || !userData) return;

    // Check message limit
    if (userData.messagesUsed >= userData.messagesLimit) {
      toast.error("Limite de messages atteinte. Améliorez votre plan.");
      return;
    }

    const userMessageText = message;
    setMessage("");
    setLoading(true);

    try {
      // Add user message to chat
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userMessageText,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, userMsg]);

      // Get AI response
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await AIService.sendMessage(
        userMessageText,
        conversationHistory,
      );

      // Add AI response to chat
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);

      // Update message count in Firebase
      await MessagesService.updateUserMessageCount(
        user.uid,
        userData.messagesUsed + 1,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setLoading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(message + emoji);
    setEmojiOpen(false);
  };

  return (
    <div id="chat-area" className="flex-1 flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col p-6 animate-fadeIn">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {/* Placeholder for empty state */}
              <div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-foreground/20 animate-scaleIn"
                style={{
                  backgroundImage:
                    "url(https://cdn.builder.io/api/v1/image/assets%2Fafa67d28f8874020a08a6dc1ed05801d%2F340d671f0c4b45db8b30096668d2bc7c)",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              <h2 className="text-lg font-semibold text-foreground mb-2 animate-slideUp">
                Commencez une conversation
              </h2>
              <p
                className="text-sm text-foreground/60 animate-slideUp"
                style={{ animationDelay: "0.1s" }}
              >
                Tapez un message ci-dessous pour commencer
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-slideUp`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-white/20 text-white rounded-br-none"
                      : "bg-white/10 text-foreground/90 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-slideUp">
                <div className="bg-white/10 text-foreground/90 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">L'IA répond...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Input Area */}
      <div
        className="px-6 py-6 animate-slideUp"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-3 border-2 border-white rounded-2xl px-4 py-3 bg-background/50 hover:border-white/80 transition-colors group">
          <input
            id="message-input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-sm leading-relaxed"
          />

          {/* Emoji Picker */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                id="emoji-btn"
                className="p-2 text-foreground/60 hover:text-foreground transition-colors hover:bg-foreground/5 rounded-lg"
                aria-label="Ajouter un emoji"
              >
                <Smile size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-card border-2 border-white rounded-2xl">
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-xl hover:scale-110 transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="p-2 text-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-foreground/10 rounded-lg flex items-center justify-center hover:scale-110 transform transition-transform"
            aria-label="Envoyer le message"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
