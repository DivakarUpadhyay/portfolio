package com.amga.lmsint.ui.notes

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.TopicValue
import com.amga.lmsint.data.repository.LearningNotesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LearningDetailUiState(
    val topic: TopicValue? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LearningDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: LearningNotesRepository
) : ViewModel() {

    private val slug: String = checkNotNull(savedState["slug"])
    private val _uiState = MutableStateFlow(LearningDetailUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching { repo.getTopic(slug) }
            .onSuccess { _uiState.value = _uiState.value.copy(isLoading = false, topic = it) }
            .onFailure { e -> _uiState.value = _uiState.value.copy(isLoading = false, error = e.message) }
    }
}
