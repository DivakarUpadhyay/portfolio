package com.amga.lmsint.ui.admin

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Difficulty
import com.amga.lmsint.data.model.InterviewQuestion
import com.amga.lmsint.data.repository.InterviewRepository
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminQuestionsUiState(
    val questions: List<InterviewQuestion> = emptyList(),
    val topicTitle: String = "",
    val isLoading: Boolean = false,
    val showDialog: Boolean = false,
    val editingQuestion: InterviewQuestion? = null,
    val dialogQuestion: String = "",
    val dialogAnswer: String = "",
    val dialogDifficulty: Difficulty = Difficulty.MEDIUM,
    val isSaving: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AdminQuestionsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val interviewRepo: InterviewRepository,
    private val topicRepo: TopicRepository
) : ViewModel() {

    private val topicId: String = checkNotNull(savedState["topicId"])
    private val _uiState = MutableStateFlow(AdminQuestionsUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true)
        val titleDef = async { runCatching { topicRepo.getTopic(topicId)?.title ?: "" }.getOrElse { "" } }
        val questionsDef = async { runCatching { interviewRepo.questionsForTopic(topicId) }.getOrElse { emptyList() } }
        _uiState.value = _uiState.value.copy(
            isLoading = false,
            topicTitle = titleDef.await(),
            questions = questionsDef.await()
        )
    }

    fun openAdd() {
        _uiState.value = _uiState.value.copy(
            showDialog = true, editingQuestion = null,
            dialogQuestion = "", dialogAnswer = "", dialogDifficulty = Difficulty.MEDIUM
        )
    }

    fun openEdit(q: InterviewQuestion) {
        _uiState.value = _uiState.value.copy(
            showDialog = true, editingQuestion = q,
            dialogQuestion = q.question, dialogAnswer = q.answer,
            dialogDifficulty = Difficulty.from(q.difficulty)
        )
    }

    fun onQuestionChange(v: String) { _uiState.value = _uiState.value.copy(dialogQuestion = v) }
    fun onAnswerChange(v: String) { _uiState.value = _uiState.value.copy(dialogAnswer = v) }
    fun onDifficultyChange(d: Difficulty) { _uiState.value = _uiState.value.copy(dialogDifficulty = d) }
    fun dismissDialog() { _uiState.value = _uiState.value.copy(showDialog = false) }

    fun saveQuestion() = viewModelScope.launch {
        val state = _uiState.value
        _uiState.value = state.copy(isSaving = true)
        runCatching {
            if (state.editingQuestion == null) {
                interviewRepo.addQuestion(
                    topicId, state.dialogQuestion.trim(), state.dialogAnswer.trim(),
                    state.dialogDifficulty.value, state.questions.size
                )
            } else {
                interviewRepo.updateQuestion(
                    state.editingQuestion.id,
                    state.dialogQuestion.trim(), state.dialogAnswer.trim(),
                    state.dialogDifficulty.value
                )
            }
        }.also {
            _uiState.value = _uiState.value.copy(isSaving = false, showDialog = false)
            load()
        }
    }

    fun deleteQuestion(q: InterviewQuestion) = viewModelScope.launch {
        runCatching { interviewRepo.deleteQuestion(q.id) }.also { load() }
    }
}
