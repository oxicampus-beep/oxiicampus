import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useConversation } from "@/hooks/useMessages";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  User as UserIcon,
  Loader2,
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { conversations, isLoading: conversationsLoading } = useMessages();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { messages, isLoading: messagesLoading, sendMessage } = useConversation(
    selectedUserId || undefined
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    const { error } = await sendMessage(newMessage.trim());
    if (!error) {
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to view messages</h1>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const selectedConversation = conversations.find(
    (c) => c.otherUserId === selectedUserId
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
              <MessageCircle className="inline-block w-8 h-8 mr-3 text-primary" />
              Messages
            </h1>

            <div className="bg-card rounded-2xl border border-border overflow-hidden h-[600px] flex">
              {/* Conversations List */}
              <div
                className={`w-full md:w-1/3 border-r border-border ${
                  selectedUserId ? "hidden md:block" : ""
                }`}
              >
                {/* Search */}
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="overflow-y-auto h-[calc(100%-73px)]">
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">
                        Start chatting with sellers from listings!
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.otherUserId}
                        onClick={() => setSelectedUserId(conv.otherUserId)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
                          selectedUserId === conv.otherUserId
                            ? "bg-primary/10"
                            : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {conv.otherUserAvatar ? (
                            <img
                              src={conv.otherUserAvatar}
                              alt={conv.otherUserName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate">
                              {conv.otherUserName}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageTime), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div
                className={`flex-1 flex flex-col ${
                  !selectedUserId ? "hidden md:flex" : ""
                }`}
              >
                {selectedUserId ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="md:hidden p-2 hover:bg-muted rounded-lg"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {selectedConversation?.otherUserAvatar ? (
                          <img
                            src={selectedConversation.otherUserAvatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {selectedConversation?.otherUserName || "User"}
                        </h3>
                        {selectedConversation?.listingTitle && (
                          <p className="text-xs text-muted-foreground">
                            Re: {selectedConversation.listingTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_id === user.id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                msg.sender_id === user.id
                                  ? "gradient-bg text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.sender_id === user.id
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatDistanceToNow(new Date(msg.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="hero"
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Messages;
