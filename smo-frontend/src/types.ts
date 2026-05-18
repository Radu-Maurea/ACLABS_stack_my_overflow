export interface Tag{
    name: string;
}

export interface QuestionTag{
    tag: Tag;
}

export interface QuestionSummary{
    id: string;
    title: string;
    is_solved: boolean;
    vote_count: number;
    created_at: string;
    author: {id: string; username:string} | null;
    question_tags: QuestionTag[];
    answer_count: number;
}

export interface Question{
    id:string;
    title:string;
    description:string;
    author_id: string;
    is_solved: boolean;
    allow_ai_companion:boolean;
    vote_count: number;
    created_at: string;
    author: {id: string; username:string} | null;
    question_tags: QuestionTag[];
    answers: Answer[];
    comments: Comment[];
}

export interface Answer{
    id: string;
    body: string;
    question_id:string;
    author_id:string;
    vote_count:number;
    is_accepted: boolean;
    is_ai_generated:boolean;
    created_at: string;
    author: {id: string; username:string} | null;
    comments: Comment[];
}

export interface Comment{
    id:string;
    body:string;
    target_id: string;
    target_type: 'question' | 'answer';
    created_at: string;
    author: {username:string} | null;
}