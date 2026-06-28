package com.amga.lmsint.ui.interview

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.repository.CourseRepository
import com.amga.lmsint.data.repository.InterviewRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TopicPracticeInfo(
    val topicId: String,
    val topicTitle: String,
    val courseTitle: String,
    val totalQuestions: Int,
    val attemptedCount: Int,
    val easyCount: Int
) {
    val readinessPercent: Int get() = if (totalQuestions > 0) (easyCount * 100) / totalQuestions else 0
}

data class InterviewPrepUiState(
    val topics: List<TopicPracticeInfo> = emptyList(),
    val totalQuestions: Int = 0,
    val overallReadiness: Int = 0,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class InterviewPrepViewModel @Inject constructor(
    private val courseRepo: CourseRepository,
    private val topicRepo: TopicRepository,
    private val interviewRepo: InterviewRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InterviewPrepUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        try {
            val coursesDef = async { courseRepo.publishedCourses() }
            val questionsDef = async { interviewRepo.allQuestions() }
            val attemptsDef = async { interviewRepo.myAttempts() }

            val courses = coursesDef.await()
            val allQuestions = questionsDef.await()
            val myAttempts = attemptsDef.await()

            // Fetch topics for each course in parallel
            val topicsByCourseDefs = courses.map { course ->
                course to async { topicRepo.topicsForCourse(course.id) }
            }

            val topicInfoMap = mutableMapOf<String, Pair<String, String>>() // topicId -> (title, courseTitle)
            for ((course, def) in topicsByCourseDefs) {
                val topics = def.await()
                for (topic in topics) {
                    topicInfoMap[topic.id] = topic.title to course.title
                    for (sub in topic.subtopics) {
                        topicInfoMap[sub.id] = sub.title to course.title
                    }
                }
            }

            val questionsByTopic = allQuestions.groupBy { it.topicId }
            val attemptsMap = myAttempts.associateBy { it.questionId }

            val topicInfos = questionsByTopic
                .mapNotNull { (topicId, questions) ->
                    val (topicTitle, courseTitle) = topicInfoMap[topicId] ?: return@mapNotNull null
                    val attempted = questions.count { attemptsMap.containsKey(it.id) }
                    val easyCount = questions.count { attemptsMap[it.id]?.difficultyRating == "easy" }
                    TopicPracticeInfo(
                        topicId = topicId, topicTitle = topicTitle, courseTitle = courseTitle,
                        totalQuestions = questions.size, attemptedCount = attempted, easyCount = easyCount
                    )
                }
                .sortedWith(compareBy({ it.courseTitle }, { it.topicTitle }))

            val totalQ = allQuestions.size
            val totalEasy = myAttempts.count { it.difficultyRating == "easy" }
            val overallReadiness = if (totalQ > 0) (totalEasy * 100) / totalQ else 0

            _uiState.value = _uiState.value.copy(
                isLoading = false, topics = topicInfos,
                totalQuestions = totalQ, overallReadiness = overallReadiness
            )
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
        }
    }
}
