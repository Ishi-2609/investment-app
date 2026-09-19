import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { Portfolio } from './pages/Portfolio'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <Portfolio />
            </PrivateRoute>
          }
        />
        {/* それ以外のパスはポートフォリオ画面へ、未ログインならログイン画面にリダイレクトされる */}
        <Route path="*" element={<Navigate to="/portfolio" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
