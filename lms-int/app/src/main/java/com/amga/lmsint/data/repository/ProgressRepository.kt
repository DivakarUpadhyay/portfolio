package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.UserProgress
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import javax.inject.Inject
import javax.inject.Singleton


@Singleton
class ProgressRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun progressForCourse(courseId: String): List<UserProgress> {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return emptyList()
        return supabase.postgrest["user_progress"]
            .select {
                filter {
                    eq("user_id", uid)
                    // filter by topic ids belonging to this course via a join would need a view;
                    // simpler: fetch all progress and filter on the client
                }
            }
            .decodeList<UserProgress>()
    }

    suspend fun completedTopicIds(): Set<String> {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return emptySet()
        return supabase.postgrest["user_progress"]
            .select { filter { eq("user_id", uid) } }
            .decodeList<UserProgress>()
            .map { it.topicId }
            .toSet()
    }

    suspend fun markComplete(topicId: String) {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return
        supabase.postgrest["user_progress"].upsert(
            listOf(UserProgress(userId = uid, topicId = topicId))
        )
    }

    suspend fun markIncomplete(topicId: String) {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return
        supabase.postgrest["user_progress"].delete {
            filter {
                eq("user_id", uid)
                eq("topic_id", topicId)
            }
        }
    }
}
