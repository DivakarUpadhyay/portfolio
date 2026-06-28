package com.amga.lmsint.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.amga.lmsint.data.model.Profile
import com.amga.lmsint.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// ---- ViewModel ----

data class AdminUsersUiState(
    val users: List<Profile> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AdminUsersViewModel @Inject constructor(private val auth: AuthRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(AdminUsersUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.value = AdminUsersUiState(isLoading = true)
        runCatching { auth.allProfiles() }
            .onSuccess { _uiState.value = AdminUsersUiState(users = it) }
            .onFailure { _uiState.value = AdminUsersUiState(isLoading = false, error = it.message) }
    }

    fun toggleRole(profile: Profile) = viewModelScope.launch {
        val newRole = if (profile.role == "admin") "user" else "admin"
        runCatching { auth.updateRole(profile.id, newRole) }.also { load() }
    }
}

// ---- Screen ----

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsersScreen(
    onBack: () -> Unit,
    vm: AdminUsersViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Users") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                state.users.isEmpty() -> Text("No users", Modifier.align(Alignment.Center))
                else -> LazyColumn(contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.users) { user ->
                        UserCard(user, onToggleRole = { vm.toggleRole(user) })
                    }
                }
            }
        }
    }
}

@Composable
private fun UserCard(profile: Profile, onToggleRole: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(1.dp)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Person, null, Modifier.padding(end = 12.dp))
            Column(Modifier.weight(1f)) {
                Text(profile.name.ifBlank { "—" }, style = MaterialTheme.typography.titleSmall)
                Text(profile.id.take(16) + "…", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Badge(
                containerColor = if (profile.role == "admin") MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.surfaceVariant
            ) { Text(profile.role) }
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = onToggleRole) {
                Icon(
                    if (profile.role == "admin") Icons.Default.PersonRemove else Icons.Default.PersonAdd,
                    "Toggle role"
                )
            }
        }
    }
}
