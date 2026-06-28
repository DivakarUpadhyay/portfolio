package com.amga.lmsint.ui.topic

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.TopicContent
import com.amga.lmsint.data.repository.InterviewRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TopicLearnUiState(
    val topicTitle: String = "",
    val topicId: String = "",
    val contents: List<TopicContent> = emptyList(),
    val hasInterviewQuestions: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class TopicLearnViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val topicRepo: TopicRepository,
    private val interviewRepo: InterviewRepository
) : ViewModel() {

    private val topicId: String = checkNotNull(savedState["topicId"])
    private val _uiState = MutableStateFlow(TopicLearnUiState(topicId = topicId))
    val uiState = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val topicDef = async { runCatching { topicRepo.getTopic(topicId) }.getOrNull() }
            val contentDef = async { runCatching { topicRepo.contentForTopic(topicId) }.getOrElse { emptyList() } }
            val hasQDef = async { runCatching { interviewRepo.hasQuestionsForTopic(topicId) }.getOrElse { false } }
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                topicTitle = topicDef.await()?.title ?: "",
                contents = contentDef.await(),
                hasInterviewQuestions = hasQDef.await()
            )
        }
    }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        val contentDef = async { runCatching { topicRepo.contentForTopic(topicId) }.getOrElse { emptyList() } }
        val hasQDef = async { runCatching { interviewRepo.hasQuestionsForTopic(topicId) }.getOrElse { false } }
        _uiState.value = _uiState.value.copy(
            isLoading = false,
            contents = contentDef.await(),
            hasInterviewQuestions = hasQDef.await()
        )
    }
}
