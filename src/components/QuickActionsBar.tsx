import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddPrivatePlayerDialog from "./AddPrivatePlayerDialog";

const QuickActionsBar = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <AddPrivatePlayerDialog
            trigger={
              <Button variant="outline" className="flex items-center gap-2 justify-center w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm sm:text-base">Add Private Player</span>
              </Button>
            }
          />
          <Button
            variant="outline"
            className="flex items-center gap-2 justify-center w-full sm:w-auto"
            onClick={() => navigate("/transfers/data-import")}
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm sm:text-base">Import Data</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsBar;