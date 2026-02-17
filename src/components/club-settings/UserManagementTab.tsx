import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserManagementHeader } from '@/components/user-management/UserManagementHeader';
import { UserTable } from '@/components/user-management/UserTable';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  club_id: string | null;
  created_at: string;
}

const UserManagementTab = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId } });
      if (error) throw new Error(error.message || 'Failed to delete user');
      if (data?.error) throw new Error(data.error);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader onUserCreated={fetchUsers} />
      {users.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>No Users Found</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No users found in the system.</p>
              <Button onClick={fetchUsers} variant="outline">Refresh Users</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Users ({users.length})</CardTitle></CardHeader>
          <CardContent>
            <UserTable
              users={users}
              currentUserId={profile?.id}
              onUpdateRole={updateUserRole}
              onDeleteUser={deleteUser}
              isDeletingUser={isDeletingUser}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagementTab;
