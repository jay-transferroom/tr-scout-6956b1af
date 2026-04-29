import { Check, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useChelseaUsers, useCurrentUser, setCurrentUserId } from "@/hooks/useChelseaUsers";
import { cn } from "@/lib/utils";

const roleLabel: Record<string, string> = {
  director: "Director",
  recruitment: "Recruitment",
  scout: "Scout",
};

const DemoUserSwitcher = () => {
  const users = useChelseaUsers();
  const current = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
          title="Demo: switch signed-in user"
        >
          <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Demo as</span>
          <span className="font-medium">{current.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Demo: switch signed-in user
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => {
          const isActive = user.id === current.id;
          return (
            <DropdownMenuItem
              key={user.id}
              onSelect={() => setCurrentUserId(user.id)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex flex-col min-w-0">
                <span className={cn("text-sm truncate", isActive && "font-medium")}>
                  {user.displayName}
                </span>
                <Badge variant="secondary" className="mt-0.5 w-fit text-[10px] font-normal">
                  {roleLabel[user.role] ?? user.role}
                </Badge>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DemoUserSwitcher;
