package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.Topic
import com.amga.lmsint.data.model.TopicContent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.storage.storage
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class TopicRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun topicsForCourse(courseId: String): List<Topic> {
        val all = supabase.postgrest["topics"]
            .select {
                filter { eq("course_id", courseId) }
                order("order_index", Order.ASCENDING)
            }
            .decodeList<Topic>()
        return buildTree(all)
    }

    private fun buildTree(flat: List<Topic>): List<Topic> {
        val roots = flat.filter { it.parentTopicId == null }
        return roots.map { root ->
            root.copy(subtopics = flat.filter { it.parentTopicId == root.id })
        }
    }

    suspend fun createTopic(courseId: String, parentId: String?, title: String, order: Int): Topic {
        supabase.postgrest["topics"].insert(
            buildJsonObject {
                put("course_id", courseId)
                put("title", title)
                put("order_index", order)
                if (parentId != null) put("parent_topic_id", parentId)
            }
        )
        return supabase.postgrest["topics"]
            .select {
                filter {
                    eq("course_id", courseId)
                    eq("title", title)
                    eq("order_index", order)
                }
                order("created_at", Order.DESCENDING)
                limit(1)
            }
            .decodeSingle<Topic>()
    }

    suspend fun updateTopic(id: String, title: String, order: Int) {
        supabase.postgrest["topics"].update({
            set("title", title)
            set("order_index", order)
        }) { filter { eq("id", id) } }
    }

    suspend fun deleteTopic(id: String) {
        supabase.postgrest["topics"].delete { filter { eq("id", id) } }
    }

    suspend fun reorderTopics(orderedIds: List<String>) {
        orderedIds.forEachIndexed { index, id ->
            supabase.postgrest["topics"].update({ set("order_index", index) }) {
                filter { eq("id", id) }
            }
        }
    }

    suspend fun contentForTopic(topicId: String): List<TopicContent> =
        supabase.postgrest["topic_content"]
            .select {
                filter { eq("topic_id", topicId) }
                order("order_index", Order.ASCENDING)
            }
            .decodeList<TopicContent>()

    suspend fun addContent(topicId: String, type: String, body: String, order: Int): TopicContent {
        supabase.postgrest["topic_content"].insert(
            buildJsonObject {
                put("topic_id", topicId)
                put("type", type)
                put("body", body)
                put("order_index", order)
            }
        )
        return supabase.postgrest["topic_content"]
            .select {
                filter {
                    eq("topic_id", topicId)
                    eq("type", type)
                    eq("order_index", order)
                }
                order("created_at", Order.DESCENDING)
                limit(1)
            }
            .decodeSingle<TopicContent>()
    }

    suspend fun updateContent(id: String, type: String, body: String) {
        supabase.postgrest["topic_content"].update({
            set("type", type)
            set("body", body)
        }) { filter { eq("id", id) } }
    }

    suspend fun deleteContent(id: String) {
        supabase.postgrest["topic_content"].delete { filter { eq("id", id) } }
    }

    suspend fun getTopic(id: String): Topic? =
        supabase.postgrest["topics"]
            .select { filter { eq("id", id) } }
            .decodeSingleOrNull<Topic>()

    suspend fun uploadTopicImage(bytes: ByteArray, fileName: String): String {
        val path = "topics/$fileName"
        supabase.storage.from("topic-images").upload(path, bytes) { upsert = false }
        return supabase.storage.from("topic-images").publicUrl(path)
    }
}
