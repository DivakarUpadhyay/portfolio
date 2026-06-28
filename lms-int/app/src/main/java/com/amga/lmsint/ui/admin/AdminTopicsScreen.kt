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
import com.amga.lmsint.data.model.Topic

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminTopicsScreen(
    onBack: () -> Unit,
    onManageContent: (String) -> Unit,
    onManageQuestions: (String) -> Unit = {},
    vm: AdminTopicsViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (state.courseTitle.isNotBlank()) "Topics: ${state.courseTitle}" else "Topics") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { vm.openAddTopic(null) }) {
                Icon(Icons.Default.Add, "Add topic")
            }
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                else -> LazyColumn(contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.topics) { topic ->
                        AdminTopicCard(
                            topic = topic,
                            isFirst = state.topics.first().id == topic.id,
                            isLast = state.topics.last().id == topic.id,
                            onEdit = { vm.openEditTopic(topic) },
                            onDelete = { vm.deleteTopic(topic) },
                            onContent = { onManageContent(topic.id) },
                            onQuestions = { onManageQuestions(topic.id) },
                            onAddSubtopic = { vm.openAddTopic(topic.id) },
                            onMoveUp = { vm.moveUp(topic) },
                            onMoveDown = { vm.moveDown(topic) },
                            onEditSubtopic = { vm.openEditTopic(it) },
                            onDeleteSubtopic = { vm.deleteTopic(it) },
                            onSubContent = { onManageContent(it.id) },
                            onSubQuestions = { onManageQuestions(it.id) }
                        )
                    }
                }
            }
        }
    }

    if (state.showDialog) {
        AlertDialog(
            onDismissRequest = vm::dismissDialog,
            title = { Text(if (state.editingTopic == null) {
                if (state.parentTopicId == null) "Add Topic" else "Add Subtopic"
            } else "Edit") },
            text = {
                OutlinedTextField(
                    value = state.dialogTitle,
                    onValueChange = vm::onTitleChange,
                    label = { Text("Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = vm::saveTopic, enabled = state.dialogTitle.isNotBlank() && !state.isSaving) {
                    if (state.isSaving) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text("Save")
                }
            },
            dismissButton = { TextButton(onClick = vm::dismissDialog) { Text("Cancel") } }
        )
    }
}

@Composable
private fun AdminTopicCard(
    topic: Topic, isFirst: Boolean, isLast: Boolean,
    onEdit: () -> Unit, onDelete: () -> Unit, onContent: () -> Unit, onQuestions: () -> Unit,
    onAddSubtopic: () -> Unit, onMoveUp: () -> Unit, onMoveDown: () -> Unit,
    onEditSubtopic: (Topic) -> Unit, onDeleteSubtopic: (Topic) -> Unit,
    onSubContent: (Topic) -> Unit, onSubQuestions: (Topic) -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(2.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(topic.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                IconButton(onClick = onMoveUp, enabled = !isFirst) { Icon(Icons.Default.KeyboardArrowUp, "Up") }
                IconButton(onClick = onMoveDown, enabled = !isLast) { Icon(Icons.Default.KeyboardArrowDown, "Down") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                OutlinedButton(onClick = onContent) {
                    Icon(Icons.Default.Article, null, Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Content", style = MaterialTheme.typography.labelSmall)
                }
                OutlinedButton(onClick = onQuestions) {
                    Icon(Icons.Default.Quiz, null, Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Q&A", style = MaterialTheme.typography.labelSmall)
                }
                OutlinedButton(onClick = onAddSubtopic) {
                    Icon(Icons.Default.SubdirectoryArrowRight, null, Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("+ Sub", style = MaterialTheme.typography.labelSmall)
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, null, Modifier.size(18.dp)) }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, null, Modifier.size(18.dp), tint = MaterialTheme.colorScheme.error)
                }
            }
            if (topic.subtopics.isNotEmpty()) {
                HorizontalDivider(Modifier.padding(vertical = 4.dp))
                topic.subtopics.forEach { sub ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(start = 12.dp)) {
                        Icon(Icons.Default.SubdirectoryArrowRight, null,
                            Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.width(4.dp))
                        Text(sub.title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        IconButton(onClick = { onSubContent(sub) }) { Icon(Icons.Default.Article, null, Modifier.size(16.dp)) }
                        IconButton(onClick = { onSubQuestions(sub) }) { Icon(Icons.Default.Quiz, null, Modifier.size(16.dp)) }
                        IconButton(onClick = { onEditSubtopic(sub) }) { Icon(Icons.Default.Edit, null, Modifier.size(16.dp)) }
                        IconButton(onClick = { onDeleteSubtopic(sub) }) {
                            Icon(Icons.Default.Delete, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }
}
