import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (success: boolean) => void;
}

const ADMIN_PASSWORD = 'sulut127'; // In a real app, this should be handled securely

export function AdminLogin({ open, onOpenChange, onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      onLogin(true);
      toast({
        title: 'Login Berhasil',
        description: 'Selamat datang, Admin!',
      });
    } else {
      toast({
        title: 'Login Gagal',
        description: 'Password salah, silakan coba lagi.',
        variant: 'destructive',
      });
    }
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Login
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Masukkan password admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-lg py-6"
          />
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}