import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';
//import Gallery from './pages/';
//import ItemDetail from './pages/ItemDetail';
import Auth from './pages/Auth';

// Placeholder pages for Phase 2 (will be built later)
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Claim from './pages/claim';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* <Route path="/" element={<Gallery />} /> */}
          {/* <Route path="/item/:id" element={<ItemDetail />} /> */}
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/report"
            element={
              <PrivateRoute>
                <Report />
              </PrivateRoute>
            }
          />
          <Route
            path="/claim/:id"
            element={
              <PrivateRoute>
                <Claim />
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;