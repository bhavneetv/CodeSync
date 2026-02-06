import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './utils/route';
import { ToastProvider } from './Components/toast-notification.jsx';

function App() {
  return (
    <BrowserRouter >
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
