import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Bot, FileText, Users, MessageSquare, Loader2, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PlayerProfileCard from "./PlayerProfileCard";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SearchResult {
  type: 'player' | 'report' | 'ai_recommendation';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  confidence?: number;
  player_id?: string;
  report_id?: string;
  relevanceScore: number;
  metadata: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  searchResults?: SearchResult[];
  timestamp: string;
  players?: PlayerData[];
  liked?: boolean | null;
  saved?: boolean;
  messageId?: string;
}

interface PlayerData {
  id: number;
  name: string;
  age?: number;
  firstnationality?: string;
  currentteam?: string;
  firstposition?: string;
  secondposition?: string;
  rating?: number;
  potential?: number;
  basevalue?: number;
  imageurl?: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  chatId?: string;
  onConversationSaved?: () => void;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ isOpen, onClose, initialQuery, chatId, onConversationSaved }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [chatTitle, setChatTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startNewConversation = () => {
    setMessages([]);
    setInputValue('');
    setChatTitle('');
    setCurrentChatId(null);
    // Don't auto-focus as it may interfere with mobile UX
  };

  const saveChat = async (title: string, query: string, chatMessages: Message[]) => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: profile.id,
          title,
          initial_query: query,
          messages: JSON.parse(JSON.stringify(chatMessages)),
          search_results: chatMessages[chatMessages.length - 1]?.searchResults ? 
            JSON.parse(JSON.stringify(chatMessages[chatMessages.length - 1]?.searchResults)) : null
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving chat:', error);
      return null;
    }
  };

  const updateChat = async (chatId: string, chatMessages: Message[]) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({
          messages: JSON.parse(JSON.stringify(chatMessages)),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const parsePlayersFromResponse = async (content: string): Promise<PlayerData[]> => {
    try {
      // Extract potential player names and IDs using various patterns
      const playerNamePatterns = [
        // Names in quotes
        /"([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)"/g,
        // Names after "player" or similar keywords
        /(?:player|striker|midfielder|defender|goalkeeper|forward|winger)\s+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi,
        // Names at start of sentences (capitalized words)
        /(?:^|\. )([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g,
        // Names with common football contexts
        /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:is|would|could|has|scored|plays|from)/g
      ];

      // Extract Player ID references (e.g., "Player 20")
      const playerIdPattern = /Player\s+(\d+)/gi;
      const playerIds = new Set<number>();
      const potentialNames = new Set<string>();
      
      // Find player ID references
      const idMatches = content.matchAll(playerIdPattern);
      for (const match of idMatches) {
        const id = parseInt(match[1]);
        if (id) {
          playerIds.add(id);
        }
      }
      
      // Find player names
      playerNamePatterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const name = match[1]?.trim();
          if (name && name.length > 3 && name.length < 50) {
            potentialNames.add(name);
          }
        }
      });

      let players: any[] = [];

      // Query by player IDs first
      if (playerIds.size > 0) {
        const { data: idPlayers, error: idError } = await supabase
          .from('players_new')
          .select('*')
          .in('id', Array.from(playerIds));

        if (!idError && idPlayers) {
          players = [...players, ...idPlayers];
        }
      }

      // Query by player names
      if (potentialNames.size > 0) {
        const { data: namePlayers, error: nameError } = await supabase
          .from('players_new')
          .select('*')
          .in('name', Array.from(potentialNames))
          .limit(10);

        if (!nameError && namePlayers) {
          // Avoid duplicates
          const existingIds = new Set(players.map(p => p.id));
          const uniqueNamePlayers = namePlayers.filter(p => !existingIds.has(p.id));
          players = [...players, ...uniqueNamePlayers];
        }
      }

      return players.slice(0, 10); // Limit to 10 total players
    } catch (error) {
      console.error('Error parsing players from response:', error);
      return [];
    }
  };

  const updateChatInteraction = async (messageId: string, field: 'liked' | 'saved', value: boolean | null) => {
    if (!currentChatId && !chatId) return;

    const chatIdToUpdate = currentChatId || chatId;
    if (!chatIdToUpdate) return;

    try {
      if (field === 'saved') {
        // Update the entire chat's saved status
        const { error } = await supabase
          .from('chats')
          .update({ [field]: value })
          .eq('id', chatIdToUpdate);

        if (error) throw error;
      } else {
        // Update the liked status
        const { error } = await supabase
          .from('chats')
          .update({ [field]: value })
          .eq('id', chatIdToUpdate);

        if (error) throw error;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, [field]: value }
          : msg
      ));

      toast.success(
        field === 'liked' 
          ? (value ? 'Response liked!' : 'Like removed')
          : (value ? 'Chat saved!' : 'Chat unsaved')
      );

      // Call the callback when a conversation is saved
      if (field === 'saved' && value && onConversationSaved) {
        onConversationSaved();
      }

    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to ${field === 'liked' ? 'like' : 'save'} response`);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');

    try {
      // Call the ai-search function
      const { data: searchData, error: searchError } = await supabase.functions.invoke('ai-search', {
        body: { query: query.trim() }
      });

      if (searchError) {
        console.error('Search error:', searchError);
        throw searchError;
      }

      const searchResults = searchData?.results || [];
      
      // Generate AI response using ChatGPT
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-chat-generate', {
        body: { 
          query: query.trim(),
          searchResults
        }
      });

      if (aiError) {
        console.error('AI generation error:', aiError);
        throw aiError;
      }

      const aiResponse = aiData?.response || `I found ${searchResults.length} results for "${query}".`;
      
      // Parse players from AI response
      const mentionedPlayers = await parsePlayersFromResponse(aiResponse);

      // Create assistant message with AI response and search results
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        searchResults,
        players: mentionedPlayers,
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save or update chat
      if (!currentChatId && !chatId) {
        const title = query.length > 50 ? query.substring(0, 50) + '...' : query;
        setChatTitle(title);
        const newChatId = await saveChat(title, query, finalMessages);
        if (newChatId) {
          setCurrentChatId(newChatId);
        }
      } else if (currentChatId || chatId) {
        await updateChat(currentChatId || chatId!, finalMessages);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing chat if chatId is provided
  useEffect(() => {
    const loadChat = async () => {
      if (chatId && profile?.id) {
        try {
          const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .eq('user_id', profile.id)
            .single();

          if (!error && data) {
            const messagesData = Array.isArray(data.messages) ? data.messages : [];
            setMessages(messagesData as unknown as Message[]);
            setChatTitle(data.title);
            setCurrentChatId(data.id);
          }
        } catch (error) {
          console.error('Error loading chat:', error);
        }
      }
    };

    loadChat();
  }, [chatId, profile?.id]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !chatId) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      handleSearch(inputValue);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'player':
        if (result.player_id) {
          if (result.metadata?.isPrivatePlayer) {
            navigate(`/private-player/${result.player_id}`);
          } else {
            navigate(`/player/${result.player_id}`);
          }
        }
        break;
      case 'report':
        if (result.report_id) {
          navigate(`/report/${result.report_id}`);
        }
        break;
    }
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <Users className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-4 right-4 w-[600px] h-[700px]">
        <Card className="w-full h-full shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">AI Scout Assistant</h2>
              {chatTitle && <p className="text-sm text-muted-foreground">{chatTitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Conversation
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-4 pt-0 h-[calc(100%-5rem)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me about players, reports, or request recommendations!</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="font-medium">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  
                   {/* Search Results - Only show player profiles */}
                   {message.searchResults && message.searchResults.filter(result => result.type === 'player').length > 0 && (
                     <div className="space-y-2 ml-4">
                       {message.searchResults
                         .filter(result => result.type === 'player')
                         .map((result, resultIndex) => (
                         <div
                           key={resultIndex}
                           className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                           onClick={() => handleResultClick(result)}
                         >
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-2">
                               {getResultIcon(result.type)}
                               <span className="font-medium truncate">{result.title}</span>
                               <Badge variant="outline" className="text-xs">
                                 player
                               </Badge>
                               {result.confidence && (
                                 <Badge variant="secondary" className="text-xs">
                                   {Math.round(result.confidence * 100)}%
                                 </Badge>
                               )}
                             </div>
                             
                             {result.subtitle && (
                               <div className="text-sm text-muted-foreground mb-1">
                                 {result.subtitle}
                               </div>
                             )}
                             
                             {result.description && (
                               <div className="text-sm text-muted-foreground">
                                 {result.description}
                               </div>
                             )}
                           </div>
                           
                           <ExternalLink className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                         </div>
                       ))}
                     </div>
                    )}
                   
                   {/* Player Profile Cards */}
                   {message.players && message.players.length > 0 && (
                     <div className="space-y-2 ml-4">
                       <div className="text-xs font-medium text-muted-foreground mb-2">
                         Mentioned Players:
                       </div>
                       {message.players.map((player, playerIndex) => (
                         <PlayerProfileCard 
                           key={playerIndex} 
                           player={player} 
                           className="text-xs"
                         />
                       ))}
                     </div>
                   )}

                   {/* Like/Dislike/Save Actions for Assistant Messages */}
                   {message.role === 'assistant' && message.messageId && (
                     <div className="flex items-center gap-2 ml-4 mt-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => updateChatInteraction(
                           message.messageId!,
                           'liked',
                           message.liked === true ? null : true
                         )}
                         className={`h-8 px-2 ${message.liked === true ? 'text-green-600 bg-green-50' : ''}`}
                       >
                         <ThumbsUp className="h-3 w-3 mr-1" />
                         <span className="text-xs">Like</span>
                       </Button>
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => updateChatInteraction(
                           message.messageId!,
                           'liked',
                           message.liked === false ? null : false
                         )}
                         className={`h-8 px-2 ${message.liked === false ? 'text-red-600 bg-red-50' : ''}`}
                       >
                         <ThumbsDown className="h-3 w-3 mr-1" />
                         <span className="text-xs">Dislike</span>
                       </Button>
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => updateChatInteraction(
                           message.messageId!,
                           'saved',
                           !message.saved
                         )}
                         className={`h-8 px-2 ${message.saved ? 'text-blue-600 bg-blue-50' : ''}`}
                       >
                         {message.saved ? (
                           <BookmarkCheck className="h-3 w-3 mr-1" />
                         ) : (
                           <Bookmark className="h-3 w-3 mr-1" />
                         )}
                         <span className="text-xs">{message.saved ? 'Saved' : 'Save'}</span>
                       </Button>
                     </div>
                   )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-3 w-3" />
                      <span className="font-medium">Assistant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing and searching...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Ask about players, reports, or request recommendations..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="text-sm"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatOverlay;