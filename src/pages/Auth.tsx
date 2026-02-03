import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">🐝 BeeHivez</h1>
          <p className="text-muted-foreground mt-2">Övervaka dina bikupor i realtid</p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logga in</TabsTrigger>
              <TabsTrigger value="register">Registrera</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function LoginForm({ 
  isSubmitting, 
  setIsSubmitting 
}: { 
  isSubmitting: boolean; 
  setIsSubmitting: (v: boolean) => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error('Inloggning misslyckades', {
        description: error.message,
      });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Logga in</CardTitle>
        <CardDescription>Ange dina uppgifter för att komma åt din dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-post</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Lösenord</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Logga in
        </Button>
      </CardContent>
    </form>
  );
}

function RegisterForm({ 
  isSubmitting, 
  setIsSubmitting 
}: { 
  isSubmitting: boolean; 
  setIsSubmitting: (v: boolean) => void;
}) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error('Registrering misslyckades', {
        description: error.message,
      });
    } else {
      toast.success('Registrering lyckades!', {
        description: 'Kontrollera din e-post för att verifiera ditt konto.',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Skapa konto</CardTitle>
        <CardDescription>Registrera dig för att börja övervaka dina kupor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Namn</Label>
          <Input
            id="register-name"
            type="text"
            placeholder="Ditt namn"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">E-post</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Lösenord</Label>
          <Input
            id="register-password"
            type="password"
            placeholder="Minst 6 tecken"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Registrera
        </Button>
      </CardContent>
    </form>
  );
}
