
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PasswordResetDialog from '@/components/PasswordResetDialog';
import { SlidingToggle } from "@/components/ui/sliding-toggle";
import { ScoutLogo } from '@/components/ScoutLogo';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"login" | "demo">("login");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Signed in successfully!');
        navigate('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password, firstName, lastName);
      
      if (error) {
        if (error.message === 'User already registered') {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
        navigate('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      name: "Oliver Smith",
      email: "scout@demo.com",
      password: "demo123",
      role: "Scout",
      dbRole: "scout"
    },
    {
      name: "Emma Johnson",
      email: "scout2@demo.com",
      password: "demo123",
      role: "Scout",
      dbRole: "scout"
    },
    {
      name: "Dave Chester", 
      email: "manager@demo.com",
      password: "demo123",
      role: "Recruitment Manager",
      dbRole: "recruitment"
    }
  ];

  const handleDemoLogin = async (demoAccount: typeof demoAccounts[0]) => {
    setLoading(true);
    try {
      const { error } = await signIn(demoAccount.email, demoAccount.password);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Signed in as ${demoAccount.role}!`);
        navigate('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo Header */}
      <div className="flex justify-center items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Transfer<span className="text-green-600">Room</span>
        </h1>
        <ScoutLogo size="lg" />
      </div>

      <div className="w-full max-w-md">
        {/* View Toggle */}
        <div className="mb-6 flex justify-center">
          <SlidingToggle
            value={viewMode}
            onChange={(value) => setViewMode(value as "login" | "demo")}
            options={[
              { 
                value: "login", 
                label: "Login"
              },
              { 
                value: "demo", 
                label: "Demo Accounts"
              }
            ]}
          />
        </div>

        {/* Login View */}
        {viewMode === "login" && (
          <Card>
            <CardHeader className="text-center">
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setResetDialogOpen(true)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Demo Accounts View */}
        {viewMode === "demo" && (
          <Card>
            <CardHeader>
              <CardTitle>Demo Accounts</CardTitle>
              <CardDescription>Click any account below to sign in instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoAccounts.map((account, index) => {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full p-4 h-auto justify-start gap-3 hover:bg-muted/50"
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading}
                  >
                    <img src="/badges/chelsea.svg" alt="Chelsea" className="h-8 w-8" />
                    <div className="text-left flex-1">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">{account.email}</div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded">
                      {account.role}
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        <PasswordResetDialog 
          open={resetDialogOpen} 
          onOpenChange={setResetDialogOpen} 
        />
      </div>
    </div>
  );
};

export default Auth;
