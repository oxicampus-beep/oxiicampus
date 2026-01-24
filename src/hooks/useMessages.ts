import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  receiver?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  listing?: {
    title: string;
    images: string[] | null;
  } | null;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  listingId: string | null;
  listingTitle: string | null;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Fetch all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch profiles
      const userIds = new Set<string>();
      messages?.forEach((msg) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.receiver_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get listing IDs
      const listingIds = [...new Set(messages?.filter(m => m.listing_id).map(m => m.listing_id) || [])];
      
      let listingsMap: Record<string, any> = {};
      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title")
          .in("id", listingIds);
        
        listingsMap = (listings || []).reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<string, any>);
      }

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg) => {
        const isUserSender = msg.sender_id === user.id;
        const otherUserId = isUserSender ? msg.receiver_id : msg.sender_id;
        const otherProfile = profilesMap[otherUserId];

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            otherUserId,
            otherUserName: otherProfile?.full_name || "User",
            otherUserAvatar: otherProfile?.avatar_url || null,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: !isUserSender && !msg.is_read ? 1 : 0,
            listingId: msg.listing_id,
            listingTitle: msg.listing_id ? listingsMap[msg.listing_id]?.title || null : null,
          });
        } else if (!isUserSender && !msg.is_read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return { conversations, isLoading, refetch: fetchConversations };
};

export const useConversation = (otherUserId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!user || !otherUserId) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get profiles for these messages
      const userIds = new Set<string>();
      data?.forEach((msg) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.receiver_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get listing details for messages with listing_id
      const listingIds = [...new Set(data?.filter(m => m.listing_id).map(m => m.listing_id) || [])];
      let listingsMap: Record<string, any> = {};
      
      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, images, price")
          .in("id", listingIds);
        
        listingsMap = (listings || []).reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<string, any>);
      }

      // Transform messages
      const transformedMessages: Message[] = (data || []).map((msg) => ({
        ...msg,
        sender: profilesMap[msg.sender_id] || null,
        receiver: profilesMap[msg.receiver_id] || null,
        listing: msg.listing_id ? listingsMap[msg.listing_id] || null : null,
      }));

      setMessages(transformedMessages);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", otherUserId);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, listingId?: string) => {
    if (!user || !otherUserId) return { error: "Not authenticated" };

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content,
        listing_id: listingId || null,
      });

      if (error) throw error;

      await fetchMessages();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`conversation-${user?.id}-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Only refetch if message is part of this conversation
          if (
            (newMessage.sender_id === user?.id && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === user?.id)
          ) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
};
