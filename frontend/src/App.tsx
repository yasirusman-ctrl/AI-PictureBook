import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StoryList from './pages/StoryList';
import StoryEditor from './pages/StoryEditor';
import PageDetail from './pages/PageDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<StoryList />} />
          <Route path="/stories/new" element={<StoryEditor />} />
          <Route path="/stories/:id" element={<StoryEditor />} />
          <Route path="/stories/:id/pages/:pageIndex" element={<PageDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
