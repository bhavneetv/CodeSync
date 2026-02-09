import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/index';
import FileUploadpage from '../pages/file-upload';
import RoomCreate from '../pages/room-create';
import CodeEditorpage from '../pages/editor';
import MainCodeEditorPage from '../pages/twst';
import Login from '../login';
import RoomCleanupPage from '../pages/room-cleanup';
import DownloadPage from '../download';
import About from '../about,';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<FileUploadpage />} />
      <Route path="/create-room" element={<RoomCreate />} />
      <Route path="/editor" element={<CodeEditorpage />} />
      <Route path="/twst" element={<MainCodeEditorPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/room-cleanup" element={<RoomCleanupPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
};

export default AppRoutes;
