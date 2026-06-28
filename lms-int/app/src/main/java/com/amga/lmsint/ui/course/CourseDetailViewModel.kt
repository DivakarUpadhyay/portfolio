package com.amga.lmsint.ui.course

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Topic
import com.amga.lmsint.data.repository.CourseRepository
import com.amga.lmsint.data.repository.ProgressRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CourseDetailUiState(
    val courseTitle: String = "",
    val courseDescription: String = "",
    val topics: List<Topic> = emptyList(),
    val completedIds: Set<String> = emptySet(),
    val expandedIds: Set<String> = emptySet(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CourseDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val courseRepo: CourseRepository,
    private val topicRepo: TopicRepository,
    private val progressRepo: ProgressRepository
) : ViewModel() {

    private val courseId: String = checkNotNull(savedState["courseId"])
    private val _uiState = MutableStateFlow(CourseDetailUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching {
            val course = courseRepo.getCourse(courseId)
            val topics = topicRepo.topicsForCourse(courseId)
            val completed = progressRepo.completedTopicIds()
            Triple(course, topics, completed)
        }.onSuccess { (course, topics, completed) ->
            _uiState.value = CourseDetailUiState(
                courseTitle = course.title,
                courseDescription = course.description,
                topics = topics,
                completedIds = completed
            )
        }.onFailure { e ->
            _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
        }
    }

    fun toggleExpand(topicId: String) {
        val current = _uiState.value.expandedIds
        _uiState.value = _uiState.value.copy(
            expandedIds = if (topicId in current) current - topicId else current + topicId
        )
    }

    fun toggleComplete(topicId: String) = viewModelScope.launch {
        val completed = _uiState.value.completedIds
        if (topicId in completed) {
            progressRepo.markIncomplete(topicId)
            _uiState.value = _uiState.value.copy(completedIds = completed - topicId)
        } else {
            progressRepo.markComplete(topicId)
            _uiState.value = _uiState.value.copy(completedIds = completed + topicId)
        }
    }
}
