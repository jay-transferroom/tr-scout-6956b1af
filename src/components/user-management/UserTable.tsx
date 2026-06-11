import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScoutAccessCell, ShortlistAccessCell } from './UserAccessColumns';
import { useUserAccessSettings, useUpdateUserAccessSetting } from '@/hooks/useUserAccessSettings';
import { useScoutUsers } from '@/hooks/useScoutUsers';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  club_id: string | null;
  created_at: string;
}

interface UserTableProps {
  users: Profile[];
}

export const UserTable = ({ 
  users, 
}: UserTableProps) => {
  const { profile } = useAuth();
  const { data: accessSettings = [] } = useUserAccessSettings();
  const { data: scoutUsers = [] } = useScoutUsers();
  const updateAccess = useUpdateUserAccessSetting();

  const getInitials = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getDisplayName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email;
  };

  const getUserAccessSetting = (userId: string) => {
    return accessSettings.find(s => s.user_id === userId);
  };

  const showAccessColumns = (role: string) => role === 'recruitment' || role === 'director';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Scout Access</TableHead>
          <TableHead>Shortlist Visibility</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const setting = getUserAccessSetting(user.id);
          const isUserDirector = user.role === 'director';
          const showAccess = showAccessColumns(user.role);

          return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getDisplayName(user)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline"
                  className={
                    user.role === 'scout' 
                      ? "text-xs bg-muted text-muted-foreground border-border" 
                      : "text-xs bg-muted/60 text-muted-foreground border-border"
                  }
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {showAccess ? (
                  <ScoutAccessCell
                    userId={user.id}
                    mode={isUserDirector ? 'all' : (setting?.scout_access_mode || 'all')}
                    selectedScoutIds={isUserDirector ? [] : (setting?.scout_access_user_ids || [])}
                    scoutUsers={scoutUsers}
                    isEditable={isDirector && !isUserDirector}
                    onModeChange={(mode, scoutIds) => {
                      updateAccess.mutate({
                        userId: user.id,
                        scoutAccessMode: mode,
                        scoutAccessUserIds: scoutIds,
                      });
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {showAccess ? (
                  <ShortlistAccessCell
                    mode={isUserDirector ? 'all' : (setting?.shortlist_access_mode || 'all')}
                    isEditable={isDirector && !isUserDirector}
                    onModeChange={(mode) => {
                      updateAccess.mutate({
                        userId: user.id,
                        shortlistAccessMode: mode,
                      });
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
