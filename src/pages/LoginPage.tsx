import { useState } from 'react';
import { Gift, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/BrandLogo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';

interface LoginPageProps {
  passwordSet: boolean;
  onLogin: () => void;
}

export function LoginPage({ passwordSet, onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(password);
      onLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-500 via-sky-700 to-sky-950 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandLogo
            className="mb-2 h-14 w-auto"
            fallback={
              <div className="rounded-full bg-amber-100 p-3">
                <Gift className="h-7 w-7 text-amber-700" />
              </div>
            }
          />
          <h1 className="text-xl font-semibold">Doorprize Ibadah Oikumene</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai admin untuk melanjutkan</p>
        </div>
        {!passwordSet && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Password admin belum diatur. Tutup aplikasi lalu jalankan ulang <b>start.bat</b>.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !password}>
            <Lock className="mr-2 h-4 w-4" />
            Masuk
          </Button>
        </form>
      </Card>
    </div>
  );
}
