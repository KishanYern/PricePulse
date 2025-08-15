import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Home from "./pages/HomePage";
import Login from "./pages/LoginPage";
import Register from "./pages/RegistrationPage";
import PriceHistoryPage from "./pages/PriceHistoryPage";
import ProductPage from "./pages/ProductPage";

// Define the paths in an array
const homePaths = ["/", "/home"];

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    { /* Home Routes */}
                    {homePaths.map((path) => (
                        <Route
                            key={path}
                            path={path}
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Home />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                    ))}
                    <Route path="/price-history" element={
                        <ProtectedRoute>
                            <MainLayout>
                                <PriceHistoryPage />
                            </MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/product/:productId" element={
                        <ProtectedRoute>
                            <MainLayout>
                                <ProductPage />
                            </MainLayout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
