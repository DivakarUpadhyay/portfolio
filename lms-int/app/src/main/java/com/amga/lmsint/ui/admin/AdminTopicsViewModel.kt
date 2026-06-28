package com.amga.lmsint.ui.admin

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Topic
import com.amga.lmsint.data.repository.CourseRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminTopicsUiState(
    val courseTitle: String = "",
    val topics: List<Topic> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showDialog: Boolean = false,
    val editingTopic: Topic? = null,
    val parentTopicId: String? = null,
    val dialogTitle: String = "",
    val isSaving: Boolean = false
)

@HiltViewModel
class AdminTopicsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val courseRepo: CourseRepository,
    private val topicRepo: TopicRepository
) : ViewModel() {

    private val courseId: String = checkNotNull(savedState["courseId"])
    private val _uiState = MutableStateFlow(AdminTopicsUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true)
        runCatching {
            val course = courseRepo.getCourse(courseId)
            val topics = topicRepo.topicsForCourse(courseId)
            course.title to topics
        }.onSuccess { (title, topics) ->
            _uiState.value = AdminTopicsUiState(courseTitle = title, topics = topics)
        }.onFailure { e ->
            _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
        }
    }

    fun openAddTopic(parentId: String? = null) {
        _uiState.value = _uiState.value.copy(showDialog = true, editingTopic = null,
            parentTopicId = parentId, dialogTitle = "")
    }

    fun openEditTopic(topic: Topic) {
        _uiState.value = _uiState.value.copy(showDialog = true, editingTopic = topic,
            parentTopicId = topic.parentTopicId, dialogTitle = topic.title)
    }

    fun onTitleChange(v: String) { _uiState.value = _uiState.value.copy(dialogTitle = v) }
    fun dismissDialog() { _uiState.value = _uiState.value.copy(showDialog = false) }

    fun saveTopic() = viewModelScope.launch {
        val state = _uiState.value
        _uiState.value = state.copy(isSaving = true)
        val order = state.topics.size
        runCatching {
            if (state.editingTopic == null) {
                topicRepo.createTopic(courseId, state.parentTopicId, state.dialogTitle.trim(), order)
            } else {
                topicRepo.updateTopic(state.editingTopic.id, state.dialogTitle.trim(), state.editingTopic.orderIndex)
            }
        }.also {
            _uiState.value = _uiState.value.copy(isSaving = false, showDialog = false)
            load()
        }
    }

    fun deleteTopic(topic: Topic) = viewModelScope.launch {
        runCatching { topicRepo.deleteTopic(topic.id) }.also { load() }
    }

    fun moveUp(topic: Topic) = viewModelScope.launch {
        val list = _uiState.value.topics.toMutableList()
        val idx = list.indexOfFirst { it.id == topic.id }
        if (idx > 0) {
            val reordered = list.apply { add(idx - 1, removeAt(idx)) }.map { it.id }
            topicRepo.reorderTopics(reordered)
            load()
        }
    }

    fun moveDown(topic: Topic) = viewModelScope.launch {
        val list = _uiState.value.topics.toMutableList()
        val idx = list.indexOfFirst { it.id == topic.id }
        if (idx < list.size - 1) {
            val reordered = list.apply { add(idx + 1, removeAt(idx)) }.map { it.id }
            topicRepo.reorderTopics(reordered)
            load()
        }
    }
}
