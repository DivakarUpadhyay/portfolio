package com.amga.lmsint.ui.admin

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.ContentType
import com.amga.lmsint.data.model.TopicContent
import com.amga.lmsint.data.repository.TopicRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminContentUiState(
    val contents: List<TopicContent> = emptyList(),
    val isLoading: Boolean = false,
    val showDialog: Boolean = false,
    val editingContent: TopicContent? = null,
    val dialogType: ContentType = ContentType.TEXT,
    val dialogBody: String = "",
    val isSaving: Boolean = false,
    val isUploadingImage: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AdminContentViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val topicRepo: TopicRepository
) : ViewModel() {

    private val topicId: String = checkNotNull(savedState["topicId"])
    private val _uiState = MutableStateFlow(AdminContentUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true)
        runCatching { topicRepo.contentForTopic(topicId) }
            .onSuccess { _uiState.value = AdminContentUiState(contents = it) }
            .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
    }

    fun openAdd() {
        _uiState.value = _uiState.value.copy(
            showDialog = true, editingContent = null,
            dialogType = ContentType.TEXT, dialogBody = ""
        )
    }

    fun openEdit(content: TopicContent) {
        _uiState.value = _uiState.value.copy(
            showDialog = true, editingContent = content,
            dialogType = ContentType.from(content.type), dialogBody = content.body
        )
    }

    fun onTypeChange(t: ContentType) {
        _uiState.value = _uiState.value.copy(dialogType = t, dialogBody = "")
    }

    fun onBodyChange(v: String) { _uiState.value = _uiState.value.copy(dialogBody = v) }

    fun dismissDialog() { _uiState.value = _uiState.value.copy(showDialog = false) }

    fun uploadImage(bytes: ByteArray, fileName: String) = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isUploadingImage = true, error = null)
        runCatching { topicRepo.uploadTopicImage(bytes, fileName) }
            .onSuccess { url ->
                _uiState.value = _uiState.value.copy(dialogBody = url, isUploadingImage = false)
            }
            .onFailure { e ->
                _uiState.value = _uiState.value.copy(isUploadingImage = false, error = e.message)
            }
    }

    fun saveContent() = viewModelScope.launch {
        val state = _uiState.value
        _uiState.value = state.copy(isSaving = true)
        val order = state.contents.size
        runCatching {
            if (state.editingContent == null) {
                topicRepo.addContent(topicId, state.dialogType.value, state.dialogBody.trim(), order)
            } else {
                topicRepo.updateContent(
                    state.editingContent.id,
                    state.dialogType.value,
                    state.dialogBody.trim()
                )
            }
        }.also {
            _uiState.value = _uiState.value.copy(isSaving = false, showDialog = false)
            load()
        }
    }

    fun delete(content: TopicContent) = viewModelScope.launch {
        runCatching { topicRepo.deleteContent(content.id) }.also { load() }
    }
}
