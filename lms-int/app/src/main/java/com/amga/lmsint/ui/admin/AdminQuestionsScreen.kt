package com.amga.lmsint.ui.admin

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.amga.lmsint.data.model.Difficulty
import com.amga.lmsint.data.model.InterviewQuestion

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminQuestionsScreen(
    onBack: () -> Unit,
    vm: AdminQuestionsViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    var deleteTarget by remember { mutableStateOf<InterviewQuestion?>(null) }

    // Intercept back press when editor is open
    BackHandler(enabled = state.showDialog) { vm.dismissDialog() }

    if (state.showDialog) {
        // Full-screen editor mode
        FullScreenQuestionEditor(
            isEdit = state.editingQuestion != null,
            question = state.dialogQuestion,
            answer = state.dialogAnswer,
            difficulty = state.dialogDifficulty,
            isSaving = state.isSaving,
            onQuestionChange = vm::onQuestionChange,
            onAnswerChange = vm::onAnswerChange,
            onDifficultyChange = vm::onDifficultyChange,
            onDiscard = vm::dismissDialog,
            onSave = vm::saveQuestion
        )
    } else {
        // List mode
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text("Interview Q&A", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                            if (state.topicTitle.isNotBlank()) {
                                Text(
                                    state.topicTitle,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = null)
                        }
                    }
                )
            },
            floatingActionButton = {
                ExtendedFloatingActionButton(
                    onClick = vm::openAdd,
                    icon = { Icon(Icons.Default.Add, null) },
                    text = { Text("Add Question", fontWeight = FontWeight.SemiBold) }
                )
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                when {
                    state.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                    state.questions.isEmpty() -> Column(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(horizontal = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Quiz,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(Modifier.height(14.dp))
                        Text(
                            "No questions yet",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Tap \"Add Question\" to create interview flashcards for this topic",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                    else -> LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        item {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Quiz,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(10.dp))
                                    Text(
                                        "${state.questions.size} question${if (state.questions.size != 1) "s" else ""} in this topic",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                        items(state.questions, key = { it.id }) { q ->
                            QuestionCard(
                                question = q,
                                onEdit = { vm.openEdit(q) },
                                onDelete = { deleteTarget = q }
                            )
                        }
                        item { Spacer(Modifier.height(72.dp)) }
                    }
                }
            }
        }

        deleteTarget?.let { q ->
            AlertDialog(
                onDismissRequest = { deleteTarget = null },
                icon = { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) },
                title = { Text("Delete Question?", fontWeight = FontWeight.Bold) },
                text = {
                    Text(
                        "\"${q.question.take(80)}${if (q.question.length > 80) "…" else ""}\" will be permanently deleted.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                confirmButton = {
                    Button(
                        onClick = { vm.deleteQuestion(q); deleteTarget = null },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                        shape = RoundedCornerShape(8.dp)
                    ) { Text("Delete", fontWeight = FontWeight.SemiBold) }
                },
                dismissButton = {
                    OutlinedButton(onClick = { deleteTarget = null }, shape = RoundedCornerShape(8.dp)) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FullScreenQuestionEditor(
    isEdit: Boolean,
    question: String,
    answer: String,
    difficulty: Difficulty,
    isSaving: Boolean,
    onQuestionChange: (String) -> Unit,
    onAnswerChange: (String) -> Unit,
    onDifficultyChange: (Difficulty) -> Unit,
    onDiscard: () -> Unit,
    onSave: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (isEdit) "Edit Question" else "New Question",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onDiscard, enabled = !isSaving) {
                        Icon(Icons.Default.Close, contentDescription = "Discard")
                    }
                },
                actions = {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .size(20.dp)
                                .padding(end = 4.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(12.dp))
                    } else {
                        TextButton(
                            onClick = onSave,
                            enabled = question.isNotBlank() && answer.isNotBlank()
                        ) {
                            Icon(Icons.Default.Check, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(
                                if (isEdit) "Update" else "Save",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Difficulty chips at top for quick access
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Difficulty:",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Difficulty.entries.forEach { d ->
                    val color = when (d) {
                        Difficulty.EASY -> Color(0xFF2E7D32)
                        Difficulty.MEDIUM -> Color(0xFFE65100)
                        Difficulty.HARD -> Color(0xFFC62828)
                    }
                    FilterChip(
                        selected = difficulty == d,
                        onClick = { onDifficultyChange(d) },
                        label = { Text(d.label, style = MaterialTheme.typography.labelMedium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = color.copy(alpha = 0.15f),
                            selectedLabelColor = color
                        )
                    )
                }
            }

            // Question field
            OutlinedTextField(
                value = question,
                onValueChange = onQuestionChange,
                label = { Text("Question") },
                placeholder = {
                    Text(
                        "e.g. What is the difference between abstract class and interface?",
                        style = MaterialTheme.typography.bodySmall
                    )
                },
                minLines = 2,
                maxLines = 5,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Answer field — fills remaining screen space
            OutlinedTextField(
                value = answer,
                onValueChange = onAnswerChange,
                label = { Text("Answer / Explanation") },
                placeholder = {
                    Text(
                        "Write a clear, detailed explanation here.\n\nYou have plenty of space — cover the concept fully.",
                        style = MaterialTheme.typography.bodySmall
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(12.dp)
            )

            // Bottom save button (extra affordance)
            Button(
                onClick = onSave,
                enabled = question.isNotBlank() && answer.isNotBlank() && !isSaving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    if (isEdit) "Update Question" else "Save Question",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp
                )
            }
        }
    }
}

@Composable
private fun QuestionCard(
    question: InterviewQuestion,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val diffColor = when (question.difficulty) {
        "easy" -> Color(0xFF2E7D32)
        "hard" -> Color(0xFFC62828)
        else -> Color(0xFFE65100)
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.Default.Help,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .size(18.dp)
                        .padding(top = 2.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    question.question,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    fontSize = 14.sp
                )
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.Default.Lightbulb,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .size(16.dp)
                        .padding(top = 2.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    question.answer,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 4,
                    modifier = Modifier.weight(1f)
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = diffColor.copy(alpha = 0.12f)
                ) {
                    Text(
                        question.difficulty.replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = diffColor,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                    Icon(
                        Icons.Default.Delete, contentDescription = "Delete",
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
