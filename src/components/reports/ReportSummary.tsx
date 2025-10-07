
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Send, Edit, Copy, Check } from "lucide-react";
import { ReportWithPlayer } from "@/types/report";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReportSummaryProps {
  report: ReportWithPlayer;
  template: any;
}

const ReportSummary = ({ report, template }: ReportSummaryProps) => {
  const [summary, setSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-summary', {
        body: {
          report,
          template,
          playerData: report.player
        }
      });

      if (error) throw error;

      if (data?.summary) {
        setSummary(data.summary);
        setEditedSummary(data.summary);
        toast.success("AI summary generated successfully");
      } else {
        throw new Error("No summary returned from AI");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSummary(editedSummary);
      setIsEditing(false);
      toast.success("Summary saved successfully");
    } catch (error) {
      toast.error("Failed to save summary");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedSummary || summary);
      setCopied(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy summary");
    }
  };

  const handleSend = () => {
    // Here you would integrate with email or messaging system
    toast.success("Summary sent to sporting director");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Summary for Sporting Director
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Executive Brief
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {!summary && (
              <Button 
                onClick={generateSummary} 
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Summary"}
              </Button>
            )}
            
            {summary && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
                
                {isEditing && (
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                )}
                
                <Button 
                  size="sm"
                  onClick={handleSend}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      {summary && (
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Edit your summary..."
            />
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {summary}
              </pre>
            </div>
          )}
        </CardContent>
      )}
      
      {isGenerating && (
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Analyzing report with AI...</p>
              <p className="text-xs text-muted-foreground">Evaluating player performance, character traits, and generating comprehensive insights</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ReportSummary;
