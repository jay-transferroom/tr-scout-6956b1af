import { useState, useEffect } from 'react';
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
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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
            <UserTable users={users} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagementTab;
