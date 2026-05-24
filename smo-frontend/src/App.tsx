import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AskQuestion from './pages/AskQuestion'
import Home from './pages/Home'
import QuestionDetailPage_ from './pages/QuestionDetail'
import { mockQuestionDetails } from './data/mockDataDetail.ts'
import { AuthProvider } from './hooks/useAuth'

function QuestionDetailPage() {
  const { id } = useParams()
  const question = mockQuestionDetails.find((q) => q.id === id)

  if (!question) {
    return <div className="max-w-3xl mx-auto p-6 text-gray-500">Question not found.</div>
  }

  return <QuestionDetailPage_ question={question} />
}

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