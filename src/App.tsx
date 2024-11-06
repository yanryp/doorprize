import { useState, useEffect } from 'react';
import { DisplayPage } from '@/pages/DisplayPage';
import { RegistrationPage } from '@/pages/RegistrationPage';
import { Toaster } from '@/components/ui/toaster';
import { useParticipants } from '@/hooks/useParticipants';
import { AdminLogin } from '@/components/AdminLogin';

function App() {
  const { participants, addParticipant, importParticipants, clearParticipants } = useParticipants();
  const [currentPage, setCurrentPage] = useState<'register' | 'display'>('register');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for admin status in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAdminMode = params.get('admin') === 'true';
    if (isAdminMode && !isAdmin) {
      setShowAdminLogin(true);
    }
  }, []);

  const handleAdminLogin = (success: boolean) => {
    setIsAdmin(success);
    setShowAdminLogin(false);
    if (success) {
      setCurrentPage('display');
      // Update URL without triggering reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('admin', 'true');
      window.history.pushState({}, '', newUrl);
    }
  };

  return (
    <div className="relative">
      <AdminLogin 
        open={showAdminLogin} 
        onOpenChange={setShowAdminLogin}
        onLogin={handleAdminLogin}
      />

      {!isAdmin && currentPage === 'display' && setCurrentPage('register')}

      {currentPage === 'register' ? (
        <RegistrationPage
          participants={participants}
          onAddParticipant={addParticipant}
        />
      ) : (
        <DisplayPage 
          participants={participants}
          onImportParticipants={importParticipants}
          onClearParticipants={clearParticipants}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App;