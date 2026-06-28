package com.amga.lmsint.ui.recordings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Recording
import com.amga.lmsint.data.repository.RecordingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RecordingsUiState(
    val recordings: List<Recording> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val playingUrl: String? = null
)

@HiltViewModel
class RecordingsViewModel @Inject constructor(
    private val repo: RecordingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RecordingsUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching { repo.myRecordings() }
            .onSuccess { _uiState.value = RecordingsUiState(recordings = it) }
            .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
    }

    fun play(recording: Recording) = viewModelScope.launch {
        runCatching { repo.getDownloadUrl(recording.filePath) }
            .onSuccess { _uiState.value = _uiState.value.copy(playingUrl = it) }
    }

    fun clearPlayback() { _uiState.value = _uiState.value.copy(playingUrl = null) }

    fun delete(recording: Recording) = viewModelScope.launch {
        runCatching { repo.delete(recording) }
            .onSuccess { load() }
    }
}
