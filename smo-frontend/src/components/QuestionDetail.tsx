import type { Question } from '../types'
import { Tag } from './Tag'
import { Upvote } from './Upvote'
import { Status } from './Status'
import { Header } from './Header'
import { AnswerEditor } from './AnswerEditor'

interface Props {
  question: Question
}

function QuestionDetail({ question }: Props) {
  return (
    <div>
      <Header />

      <div className="max-w-5xl mx-auto px-10 py-6">
        {/* Question */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-3">
          <div className="flex gap-2 flex-wrap mb-3">
            {question.question_tags.map((qt) => (
              <Tag key={qt.tag.name} name={qt.tag.name} />
            ))}
          </div>
          <p className="text-lg font-semibold text-black mb-3">{question.title}</p>
          <p className="text-sm text-gray-700">{question.description}</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Upvote count={question.vote_count} />
          <Status solved={question.is_solved} />
          {question.allow_ai_companion && (
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#FFB6C1', color: '#744577' }}>AI Enabled</span>
          )}
          <span className="text-xs text-gray-500 ml-auto">Asked by <span className="font-medium text-gray-700">{question.author?.username ?? 'Anonymous'}</span> · {new Date(question.created_at).toLocaleDateString()}</span>
        </div>

        {/* Answers */}
        <p className="text-lg text-black font-semibold mb-4 pb-2">{question.answers.length} Answers</p>

        <div className="flex flex-col gap-4">
          {question.answers.map((a) => (
            <div key={a.id} className={`border rounded-lg p-6 shadow-sm ${a.is_accepted ? 'border-green-400 bg-green-50/30' : ''}`}>
              <p className="text-gray-700 text-sm mb-4">{a.body}</p>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Upvote count={a.vote_count} />
                {a.is_accepted && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#e8f0e1', color: '#5B7E3C' }}>✓ Accepted</span>
                )}
                {a.is_ai_generated && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-medium px-3 py-1 rounded-full">AI Generated</span>
                )}
                <span className="ml-auto">Answered by <span className="font-medium text-gray-700">{a.author?.username ?? 'Anonymous'}</span> · {new Date(a.created_at).toLocaleDateString()}</span>
              </div>

              {a.comments.length > 0 && (
                <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                  {a.comments.map((c) => (
                    <p key={c.id} className="text-xs text-gray-500">
                      💬 {c.body} — <span className="font-medium">{c.author?.username ?? 'Anonymous'}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-lg font-semibold text-black mb-3 pb-2">Your Answer</p>
          <AnswerEditor />
          <button className="mt-3 px-6 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
            Post Answer
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionDetail
