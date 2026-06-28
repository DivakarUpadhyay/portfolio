package com.amga.lmsint.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
    val isAdmin: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val auth: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState = _uiState.asStateFlow()

    fun onEmailChange(v: String) = _uiState.value.let { _uiState.value = it.copy(email = v) }
    fun onPasswordChange(v: String) = _uiState.value.let { _uiState.value = it.copy(password = v) }

    fun login() = viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        runCatching {
            auth.login(_uiState.value.email.trim(), _uiState.value.password)
        }.onSuccess {
            val admin = runCatching { auth.isAdmin() }.getOrDefault(false)
            _uiState.value = _uiState.value.copy(isLoading = false, success = true, isAdmin = admin)
        }.onFailure { e ->
            _uiState.value = _uiState.value.copy(isLoading = false, error = e.message ?: "Login failed")
        }
    }
}
