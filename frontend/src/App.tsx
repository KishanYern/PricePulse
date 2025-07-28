import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Router>
            <AuthProvider>
                {" "}
                <Routes>
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/register' element={<RegistrationPage />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path='/home' element={<HomePage />} />
                        {/* Add other protected routes here */}
                        <Route path='/' element={<HomePage />} />{" "}
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
