package com.amga.lmsint.ui.notes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.TopicValue
import com.amga.lmsint.data.repository.LearningNotesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LearningCatalogUiState(
    val allTopics: List<TopicValue> = emptyList(),
    val filteredTopics: List<TopicValue> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LearningCatalogViewModel @Inject constructor(
    private val repo: LearningNotesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LearningCatalogUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching { repo.allTopics() }
            .onSuccess { topics ->
                val query = _uiState.value.searchQuery
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    allTopics = topics,
                    filteredTopics = filter(topics, query)
                )
            }
            .onFailure { e ->
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
    }

    fun onSearch(query: String) {
        val topics = _uiState.value.allTopics
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            filteredTopics = filter(topics, query)
        )
    }

    private fun filter(topics: List<TopicValue>, query: String): List<TopicValue> {
        if (query.isBlank()) return topics
        val q = query.trim().lowercase()
        return topics.filter {
            it.title.lowercase().contains(q) || it.slug.lowercase().contains(q)
        }
    }
}
