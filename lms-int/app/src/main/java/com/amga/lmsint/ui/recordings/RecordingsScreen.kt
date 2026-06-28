package com.amga.lmsint.ui.recordings

import android.media.MediaPlayer
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
import com.amga.lmsint.data.model.Recording

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordingsScreen(
    onBack: () -> Unit,
    vm: RecordingsViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    var deleteTarget by remember { mutableStateOf<Recording?>(null) }

    LaunchedEffect(state.playingUrl) {
        state.playingUrl?.let { url ->
            try {
                MediaPlayer().apply {
                    setDataSource(url)
                    prepareAsync()
                    setOnPreparedListener { it.start() }
                    setOnCompletionListener { it.release() }
                }
            } catch (_: Exception) {}
            vm.clearPlayback()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Recordings") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                state.recordings.isEmpty() -> Text(
                    "No recordings yet",
                    Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                else -> LazyColumn(contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.recordings) { rec ->
                        RecordingCard(
                            recording = rec,
                            onPlay = { vm.play(rec) },
                            onDelete = { deleteTarget = rec }
                        )
                    }
                }
            }
        }
    }

    deleteTarget?.let { rec ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Delete recording?") },
            text = { Text(rec.title) },
            confirmButton = {
                TextButton(onClick = { vm.delete(rec); deleteTarget = null }) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { deleteTarget = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun RecordingCard(recording: Recording, onPlay: () -> Unit, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(1.dp)) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(recording.title, style = MaterialTheme.typography.titleMedium)
                val mins = recording.durationSeconds / 60
                val secs = recording.durationSeconds % 60
                Text("%02d:%02d".format(mins, secs),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = onPlay) { Icon(Icons.Default.PlayCircle, "Play") }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}
