import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/Signup'
import AskQuestion from './pages/AskQuestion'
import Home from './pages/Home'
import QuestionDetailPage from './pages/QuestionDetail'
import { AuthProvider } from './hooks/useAuth'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/question/:id" element={<QuestionDetailPage />} />
            <Route path="/questions/new" element={<AskQuestion />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
