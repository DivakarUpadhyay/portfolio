package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.InterviewQuestion
import com.amga.lmsint.data.model.QuestionAttempt
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class InterviewRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun questionsForTopic(topicId: String): List<InterviewQuestion> =
        supabase.postgrest["interview_questions"]
            .select {
                filter { eq("topic_id", topicId) }
                order("order_index", Order.ASCENDING)
            }
            .decodeList<InterviewQuestion>()

    suspend fun hasQuestionsForTopic(topicId: String): Boolean =
        supabase.postgrest["interview_questions"]
            .select { filter { eq("topic_id", topicId) } }
            .decodeList<InterviewQuestion>()
            .isNotEmpty()

    suspend fun allQuestions(): List<InterviewQuestion> =
        supabase.postgrest["interview_questions"]
            .select { order("topic_id", Order.ASCENDING) }
            .decodeList<InterviewQuestion>()

    suspend fun addQuestion(
        topicId: String, question: String, answer: String, difficulty: String, order: Int
    ): InterviewQuestion {
        supabase.postgrest["interview_questions"].insert(
            buildJsonObject {
                put("topic_id", topicId)
                put("question", question)
                put("answer", answer)
                put("difficulty", difficulty)
                put("order_index", order)
            }
        )
        return supabase.postgrest["interview_questions"]
            .select {
                filter {
                    eq("topic_id", topicId)
                    eq("question", question)
                }
                order("created_at", Order.DESCENDING)
                limit(1)
            }
            .decodeSingle<InterviewQuestion>()
    }

    suspend fun updateQuestion(id: String, question: String, answer: String, difficulty: String) {
        supabase.postgrest["interview_questions"].update({
            set("question", question)
            set("answer", answer)
            set("difficulty", difficulty)
        }) { filter { eq("id", id) } }
    }

    suspend fun deleteQuestion(id: String) {
        supabase.postgrest["interview_questions"].delete { filter { eq("id", id) } }
    }

    suspend fun myAttempts(): List<QuestionAttempt> {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return emptyList()
        return supabase.postgrest["question_attempts"]
            .select { filter { eq("user_id", uid) } }
            .decodeList<QuestionAttempt>()
    }

    suspend fun recordAttempt(questionId: String, difficultyRating: String) {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return
        supabase.postgrest["question_attempts"].upsert(
            listOf(QuestionAttempt(userId = uid, questionId = questionId, difficultyRating = difficultyRating))
        )
    }
}
