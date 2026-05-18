import { useNavigate } from 'react-router-dom'
import type { QuestionSummary } from '../types'
import { Tag } from './Tag'
import { Upvote } from './Upvote'
import { Status } from './Status'

interface Props {
  question: QuestionSummary
}

function QuestionCard({ question }: Props) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/question/${question.id}`)}
      className="border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-orange-300 hover:bg-orange-50/30 transition cursor-pointer"
    >
      <div className="flex gap-2 flex-wrap mb-3">
        {question.question_tags.map((qt) => (
          <Tag key={qt.tag.name} name={qt.tag.name} />
        ))}
      </div>

      <p className="text-lg font-semibold mb-3 text-left text-black">{question.title}</p>

      <div className="flex items-center gap-3">
        <Status solved={question.is_solved} />
        <Upvote count={question.vote_count} />
        <span className="text-xs text-gray-700">
          💬 {question.answer_count} · {new Date(question.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default QuestionCard