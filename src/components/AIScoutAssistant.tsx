import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import ChatOverlay from './ChatOverlay';


const AIScoutAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string>('');

  const handleSuggestionClick = (suggestion: string) => {
    setInitialQuery(suggestion);
    setIsChatOpen(true);
  };

  const openChat = () => {
    setInitialQuery('');
    setIsChatOpen(true);
  };

  const suggestions = [
    "Show me fast wingers under 23",
    "Find central defenders good at aerial duels",
    "Players similar to Kevin De Bruyne",
    "Prospects from Germany under 20"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Scout Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Trigger Button */}
        <Button 
          onClick={openChat}
          className="w-full justify-start"
          variant="outline"
        >
          Start AI conversation...
        </Button>

        {/* Quick Suggestions */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      
      <ChatOverlay 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={initialQuery}
      />
    </Card>
  );
};

export default AIScoutAssistant;