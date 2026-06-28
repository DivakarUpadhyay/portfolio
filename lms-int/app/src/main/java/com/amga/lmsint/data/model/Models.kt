package com.amga.lmsint.data.model

import kotlinx.serialization.EncodeDefault
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Profile(
    val id: String = "",
    val name: String = "",
    val role: String = "user",
    @SerialName("created_at") val createdAt: String = ""
)

@Serializable
data class Course(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    @SerialName("is_published") val isPublished: Boolean = false,
    @SerialName("created_by") val createdBy: String? = null,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = ""
)

@Serializable
data class Topic(
    val id: String = "",
    @SerialName("course_id") val courseId: String = "",
    @SerialName("parent_topic_id") val parentTopicId: String? = null,
    val title: String = "",
    @SerialName("order_index") val orderIndex: Int = 0,
    @SerialName("created_at") val createdAt: String = "",
    val subtopics: List<Topic> = emptyList()
)

@Serializable
data class TopicContent(
    val id: String = "",
    @SerialName("topic_id") val topicId: String = "",
    val type: String = "text",
    val body: String = "",
    @SerialName("order_index") val orderIndex: Int = 0,
    @SerialName("created_at") val createdAt: String = ""
)

@Serializable
data class UserProgress(
    @EncodeDefault(EncodeDefault.Mode.NEVER) val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("topic_id") val topicId: String = "",
    @EncodeDefault(EncodeDefault.Mode.NEVER) @SerialName("completed_at") val completedAt: String = ""
)

@Serializable
data class Recording(
    val id: String = "",
    @SerialName("user_id") val userId: String = "",
    val title: String = "",
    @SerialName("file_path") val filePath: String = "",
    @SerialName("duration_seconds") val durationSeconds: Int = 0,
    @SerialName("created_at") val createdAt: String = ""
)

enum class ContentType(val value: String) {
    TEXT("text"),
    YOUTUBE("youtube"),
    LINK("link"),
    IMAGE("image");
    companion object {
        fun from(value: String) = entries.firstOrNull { it.value == value } ?: TEXT
    }
}

@Serializable
data class InterviewQuestion(
    val id: String = "",
    @SerialName("topic_id") val topicId: String = "",
    val question: String = "",
    val answer: String = "",
    val difficulty: String = "medium",
    @SerialName("order_index") val orderIndex: Int = 0,
    @SerialName("created_at") val createdAt: String = ""
)

@Serializable
data class QuestionAttempt(
    @EncodeDefault(EncodeDefault.Mode.NEVER) val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("question_id") val questionId: String = "",
    @SerialName("difficulty_rating") val difficultyRating: String = "medium",
    @EncodeDefault(EncodeDefault.Mode.NEVER) @SerialName("attempted_at") val attemptedAt: String = ""
)

@Serializable
data class TopicValue(
    val title: String = "",
    val slug: String = "",
    val content: String = "",
    val active: Boolean = true,
    @SerialName("created_at") val createdAt: String = ""
)

@Serializable
data class PortfolioDataEntry(
    val key: String = "",
    val value: TopicValue = TopicValue()
)

enum class Difficulty(val value: String, val label: String) {
    EASY("easy", "Easy"),
    MEDIUM("medium", "Medium"),
    HARD("hard", "Hard");
    companion object {
        fun from(value: String) = entries.firstOrNull { it.value == value } ?: MEDIUM
    }
}
