package com.amga.lmsint.ui.recorder

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecorderScreen(
    onBack: () -> Unit,
    onViewRecordings: () -> Unit,
    vm: RecorderViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    var titleDialog by remember { mutableStateOf(false) }
    var pendingTitle by remember { mutableStateOf("") }
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) vm.startRecording()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Interview Recorder") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                actions = {
                    IconButton(onClick = onViewRecordings) {
                        Icon(Icons.Default.FolderOpen, "My Recordings")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val mins = state.elapsedSeconds / 60
            val secs = state.elapsedSeconds % 60
            Text(
                text = if (state.isRecording) "%02d:%02d".format(mins, secs) else "00:00",
                style = MaterialTheme.typography.headlineMedium
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = when {
                    state.isUploading -> "Uploading..."
                    state.isRecording -> "Recording — keep app open"
                    else -> "Tap to start recording"
                },
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(Modifier.height(32.dp))

            if (state.isUploading) {
                CircularProgressIndicator()
            } else {
                FloatingActionButton(
                    onClick = {
                        if (state.isRecording) {
                            pendingTitle = ""
                            titleDialog = true
                        } else {
                            val hasPermission = ContextCompat.checkSelfPermission(
                                context, Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                            if (hasPermission) vm.startRecording()
                            else permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    },
                    containerColor = if (state.isRecording) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        if (state.isRecording) Icons.Default.Stop else Icons.Default.Mic,
                        contentDescription = null
                    )
                }
            }

            state.message?.let {
                Spacer(Modifier.height(24.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
            state.error?.let {
                Spacer(Modifier.height(24.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }

    if (titleDialog) {
        AlertDialog(
            onDismissRequest = { titleDialog = false },
            title = { Text("Save Recording") },
            text = {
                OutlinedTextField(
                    value = pendingTitle,
                    onValueChange = { pendingTitle = it },
                    label = { Text("Title (optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    titleDialog = false
                    vm.stopAndUpload(pendingTitle)
                }) { Text("Save & Upload") }
            },
            dismissButton = {
                TextButton(onClick = { titleDialog = false }) { Text("Cancel") }
            }
        )
    }
}
