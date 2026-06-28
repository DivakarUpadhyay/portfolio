package com.amga.lmsint.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.model.Course
import com.amga.lmsint.data.repository.CourseRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminCoursesUiState(
    val courses: List<Course> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showAddDialog: Boolean = false,
    val editingCourse: Course? = null,
    val dialogTitle: String = "",
    val dialogDescription: String = "",
    val isSaving: Boolean = false
)

@HiltViewModel
class AdminCoursesViewModel @Inject constructor(
    private val repo: CourseRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminCoursesUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching { repo.allCourses() }
            .onSuccess { _uiState.value = AdminCoursesUiState(courses = it) }
            .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
    }

    fun openAddDialog() {
        _uiState.value = _uiState.value.copy(showAddDialog = true, editingCourse = null,
            dialogTitle = "", dialogDescription = "")
    }

    fun openEditDialog(course: Course) {
        _uiState.value = _uiState.value.copy(showAddDialog = true, editingCourse = course,
            dialogTitle = course.title, dialogDescription = course.description)
    }

    fun onDialogTitleChange(v: String) { _uiState.value = _uiState.value.copy(dialogTitle = v) }
    fun onDialogDescChange(v: String) { _uiState.value = _uiState.value.copy(dialogDescription = v) }
    fun dismissDialog() { _uiState.value = _uiState.value.copy(showAddDialog = false) }

    fun saveCourse() = viewModelScope.launch {
        val state = _uiState.value
        _uiState.value = state.copy(isSaving = true)
        runCatching {
            if (state.editingCourse == null) {
                repo.createCourse(state.dialogTitle.trim(), state.dialogDescription.trim())
            } else {
                repo.updateCourse(state.editingCourse.id, state.dialogTitle.trim(),
                    state.dialogDescription.trim(), state.editingCourse.isPublished)
            }
        }.also {
            _uiState.value = _uiState.value.copy(isSaving = false, showAddDialog = false)
            load()
        }
    }

    fun togglePublish(course: Course) = viewModelScope.launch {
        runCatching { repo.togglePublish(course.id, !course.isPublished) }.also { load() }
    }

    fun deleteCourse(course: Course) = viewModelScope.launch {
        runCatching { repo.deleteCourse(course.id) }.also { load() }
    }
}
