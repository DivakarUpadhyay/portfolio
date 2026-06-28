package com.amga.lmsint.ui.interview

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.InterviewQuestion
import com.amga.lmsint.data.repository.InterviewRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuestionPracticeUiState(
    val topicTitle: String = "",
    val questions: List<InterviewQuestion> = emptyList(),
    val currentIndex: Int = 0,
    val isAnswerRevealed: Boolean = false,
    val sessionRatings: Map<String, String> = emptyMap(),
    val isLoading: Boolean = false,
    val isDone: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null
) {
    val currentQuestion: InterviewQuestion? get() = questions.getOrNull(currentIndex)
    val gotItCount: Int get() = sessionRatings.values.count { it == "easy" }
    val needReviewCount: Int get() = sessionRatings.values.count { it == "hard" }
    val progressFraction: Float
        get() = if (questions.isEmpty()) 0f else currentIndex.toFloat() / questions.size
}

@HiltViewModel
class QuestionPracticeViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val interviewRepo: InterviewRepository,
    private val topicRepo: TopicRepository
) : ViewModel() {

    private val topicId: String = checkNotNull(savedState["topicId"])
    private val _uiState = MutableStateFlow(QuestionPracticeUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true)
        val titleDef = async { runCatching { topicRepo.getTopic(topicId)?.title ?: "" }.getOrElse { "" } }
        val questionsDef = async { runCatching { interviewRepo.questionsForTopic(topicId) }.getOrElse { emptyList() } }
        val attemptsDef = async { runCatching { interviewRepo.myAttempts() }.getOrElse { emptyList() } }

        val questions = questionsDef.await()
        val attempts = attemptsDef.await()
        val questionIds = questions.map { it.id }.toSet()
        val existingRatings = attempts
            .filter { it.questionId in questionIds }
            .associate { it.questionId to it.difficultyRating }

        _uiState.value = _uiState.value.copy(
            isLoading = false,
            topicTitle = titleDef.await(),
            questions = questions,
            currentIndex = 0,
            isAnswerRevealed = false,
            sessionRatings = existingRatings,
            isDone = false
        )
    }

    fun revealAnswer() {
        _uiState.value = _uiState.value.copy(isAnswerRevealed = true)
    }

    fun rateQuestion(rating: String) = viewModelScope.launch {
        val state = _uiState.value
        val q = state.currentQuestion ?: return@launch
        _uiState.value = state.copy(isSaving = true)
        runCatching { interviewRepo.recordAttempt(q.id, rating) }
        val newRatings = state.sessionRatings + (q.id to rating)
        val nextIndex = state.currentIndex + 1
        _uiState.value = _uiState.value.copy(
            isSaving = false,
            sessionRatings = newRatings,
            currentIndex = nextIndex,
            isAnswerRevealed = false,
            isDone = nextIndex >= state.questions.size
        )
    }

    fun restart() {
        _uiState.value = _uiState.value.copy(
            currentIndex = 0,
            isAnswerRevealed = false,
            isDone = false,
            sessionRatings = emptyMap()
        )
    }
}
