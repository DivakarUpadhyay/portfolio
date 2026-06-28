package com.amga.lmsint.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Course
import com.amga.lmsint.data.repository.AuthRepository
import com.amga.lmsint.data.repository.CourseRepository
import com.amga.lmsint.data.repository.ProgressRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val courses: List<Course> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isAdmin: Boolean = false,
    val userName: String = ""
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val courses: CourseRepository,
    private val auth: AuthRepository,
    private val progress: ProgressRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching {
            val profile = auth.currentProfile()
            val isAdmin = profile?.role == "admin"
            val list = courses.publishedCourses()
            Triple(isAdmin, list, profile?.name ?: "")
        }.onSuccess { (admin, list, name) ->
            _uiState.value = HomeUiState(courses = list, isAdmin = admin, userName = name)
        }.onFailure { e ->
            _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
        }
    }

    fun logout() = viewModelScope.launch { auth.logout() }
}
