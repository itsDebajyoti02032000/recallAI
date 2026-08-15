import { useConnectionStore } from './stores/connectionStore';
import { LandingPage } from './components/landing/LandingPage';
import { ChatPage } from './components/chat/ChatPage';
import { Sidebar } from './components/sidebar/Sidebar';

export default function App() {
  const isConnected = useConnectionStore((s) => s.isConnected);

  if (!isConnected) {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatPage />
    </div>
  );
}
