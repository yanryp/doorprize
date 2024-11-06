import { Routes } from '@/components/Routes';
import { useParticipants } from '@/hooks/useParticipants';

function App() {
  const { participants, addParticipant, importParticipants } = useParticipants();
  const [currentPage, setCurrentPage] = useState<'register' | 'display'>('register');

  // Admin URL should include ?admin=true
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant={currentPage === 'register' ? 'secondary' : 'outline'}
          onClick={() => setCurrentPage('register')}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Daftar
        </Button>
        {isAdmin && (
          <Button
            variant={currentPage === 'display' ? 'secondary' : 'outline'}
            onClick={() => setCurrentPage('display')}
            className="flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            Tampilan
          </Button>
        )}
      </div>

      {!isAdmin && currentPage === 'display' && setCurrentPage('register')}

      {currentPage === 'register' ? (
        <RegistrationPage
          participants={participants}
          onAddParticipant={addParticipant}
        />
      ) : (
        <DisplayPage 
          participants={participants}
          onImportCSV={importParticipants}
        />
      )}
    </div>
  );
}