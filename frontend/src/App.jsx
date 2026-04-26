import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FieldList from "./pages/FieldList";
import FieldDetail from "./pages/FieldDetail";
import FieldForm from "./pages/FieldForm";
import NotFound from "./pages/NotFound";
import "./styles/global.css";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/fields" element={<FieldList />} />
            <Route path="/fields/new" element={
              <ProtectedRoute adminOnly>
                <FieldForm />
              </ProtectedRoute>
            } />
            <Route path="/fields/:id" element={<FieldDetail />} />
            <Route path="/fields/:id/edit" element={
              <ProtectedRoute adminOnly>
                <FieldForm />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
