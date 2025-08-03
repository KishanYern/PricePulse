import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute'; 
import Home from './pages/HomePage';
import Login from './pages/LoginPage';
import Register from './pages/RegistrationPage';

// Define the paths in an array
const homePaths = ['/', '/home'];

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path='/register' element={<Register />} />

          {homePaths.map(path => (
            <Route 
              key={path}
              path={path} 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
          ))}

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;