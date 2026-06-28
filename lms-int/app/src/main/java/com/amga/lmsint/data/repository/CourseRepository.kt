package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.Course
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CourseRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun publishedCourses(): List<Course> =
        supabase.postgrest["courses"]
            .select { filter { eq("is_published", true) }; order("created_at", Order.DESCENDING) }
            .decodeList<Course>()

    suspend fun allCourses(): List<Course> =
        supabase.postgrest["courses"]
            .select { order("created_at", Order.DESCENDING) }
            .decodeList<Course>()

    suspend fun getCourse(id: String): Course =
        supabase.postgrest["courses"]
            .select { filter { eq("id", id) } }
            .decodeSingle<Course>()

    suspend fun createCourse(title: String, description: String): Course =
        supabase.postgrest["courses"]
            .insert(mapOf("title" to title, "description" to description))
            .decodeSingle<Course>()

    suspend fun updateCourse(id: String, title: String, description: String, isPublished: Boolean) {
        supabase.postgrest["courses"].update({
            set("title", title)
            set("description", description)
            set("is_published", isPublished)
        }) { filter { eq("id", id) } }
    }

    suspend fun deleteCourse(id: String) {
        supabase.postgrest["courses"].delete { filter { eq("id", id) } }
    }

    suspend fun togglePublish(id: String, publish: Boolean) {
        supabase.postgrest["courses"].update({ set("is_published", publish) }) {
            filter { eq("id", id) }
        }
    }
}
