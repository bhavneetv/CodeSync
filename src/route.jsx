import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/index';
import FileUploadpage from './pages/file-upload';
import RoomCreate from './pages/room-create';
import CodeEditorpage from './pages/editor';
import Login from './login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<FileUploadpage />} />
      <Route path="/create-room" element={<RoomCreate />} />
      <Route path="/editor" element={<CodeEditorpage />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;
