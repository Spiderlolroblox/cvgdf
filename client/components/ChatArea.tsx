import { Send, Smile } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "🎉", "🔥", "👍", "❤️", "✨", "🚀", "💯"];

export function ChatArea() {
  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      console.log("Message sent:", message);
      setMessage("");
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(message + emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 animate-fadeIn">
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
            Start a conversation
          </h2>
          <p className="text-sm text-foreground/60 animate-slideUp" style={{ animationDelay: "0.1s" }}>
            Type a message below to begin
          </p>
        </div>
      </div>

      {/* Message Input Area */}
      <div className="px-6 py-6 animate-slideUp" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-3 border-2 border-white rounded-2xl px-4 py-3 bg-background/50 hover:border-white/80 transition-colors group">
          <input
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
                className="p-2 text-foreground/60 hover:text-foreground transition-colors hover:bg-foreground/5 rounded-lg"
                aria-label="Add emoji"
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
            className="p-2 text-foreground hover:text-foreground transition-colors hover:bg-foreground/10 rounded-lg flex items-center justify-center hover:scale-110 transform transition-transform"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
