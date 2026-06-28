package com.amga.lmsint.ui.interview

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestionPracticeScreen(
    onBack: () -> Unit,
    vm: QuestionPracticeViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val green = Color(0xFF2E7D32)
    val amber = Color(0xFFE65100)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Practice", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        if (state.topicTitle.isNotBlank()) {
                            Text(
                                state.topicTitle,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1
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
                        Icons.Default.Quiz, null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                        modifier = Modifier.size(72.dp)
                    )
                    Spacer(Modifier.height(14.dp))
                    Text(
                        "No questions yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                state.isDone -> SummaryScreen(
                    state = state,
                    green = green,
                    amber = amber,
                    onRestart = vm::restart,
                    onBack = onBack
                )
                else -> FlashcardContent(
                    state = state,
                    green = green,
                    amber = amber,
                    onReveal = vm::revealAnswer,
                    onRate = vm::rateQuestion,
                    isSaving = state.isSaving
                )
            }
        }
    }
}

@Composable
private fun FlashcardContent(
    state: QuestionPracticeUiState,
    green: Color,
    amber: Color,
    onReveal: () -> Unit,
    onRate: (String) -> Unit,
    isSaving: Boolean
) {
    val q = state.currentQuestion ?: return
    val diffColor = when (q.difficulty) {
        "easy" -> green
        "hard" -> Color(0xFFC62828)
        else -> amber
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Progress
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "${state.currentIndex + 1} / ${state.questions.size}",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(Modifier.width(10.dp))
            LinearProgressIndicator(
                progress = { (state.currentIndex + 1).toFloat() / state.questions.size },
                modifier = Modifier
                    .weight(1f)
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }

        // Session stats row
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = green.copy(alpha = 0.12f)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, null, Modifier.size(13.dp), tint = green)
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${state.gotItCount} Got It",
                        style = MaterialTheme.typography.labelSmall,
                        color = green,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = amber.copy(alpha = 0.12f)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Refresh, null, Modifier.size(13.dp), tint = amber)
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${state.needReviewCount} Review",
                        style = MaterialTheme.typography.labelSmall,
                        color = amber,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            Spacer(Modifier.weight(1f))
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = diffColor.copy(alpha = 0.12f)
            ) {
                Text(
                    q.difficulty.replaceFirstChar { it.uppercase() },
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = diffColor,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        // Question card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            elevation = CardDefaults.cardElevation(4.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Question section
                Row(verticalAlignment = Alignment.Top) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                    ) {
                        Icon(
                            Icons.Default.Help, null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .padding(8.dp)
                                .size(18.dp)
                        )
                    }
                    Spacer(Modifier.width(10.dp))
                    Text(
                        "Question",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
                Text(
                    q.question,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    fontSize = 17.sp,
                    lineHeight = 26.sp
                )

                // Answer section (animated)
                AnimatedVisibility(
                    visible = state.isAnswerRevealed,
                    enter = fadeIn() + expandVertically()
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(0.5f))
                        Row(verticalAlignment = Alignment.Top) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = green.copy(alpha = 0.12f)
                            ) {
                                Icon(
                                    Icons.Default.Lightbulb, null,
                                    tint = green,
                                    modifier = Modifier
                                        .padding(8.dp)
                                        .size(18.dp)
                                )
                            }
                            Spacer(Modifier.width(10.dp))
                            Text(
                                "Answer",
                                style = MaterialTheme.typography.labelLarge,
                                color = green,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(top = 6.dp)
                            )
                        }
                        Text(
                            q.answer,
                            style = MaterialTheme.typography.bodyMedium,
                            fontSize = 15.sp,
                            lineHeight = 23.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        // Action buttons
        if (!state.isAnswerRevealed) {
            Button(
                onClick = onReveal,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.Visibility, null, Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Reveal Answer", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { if (!isSaving) onRate("hard") },
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    enabled = !isSaving,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = amber)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Default.Refresh, null, Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Need Review", fontWeight = FontWeight.SemiBold)
                    }
                }
                Button(
                    onClick = { if (!isSaving) onRate("easy") },
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    enabled = !isSaving,
                    colors = ButtonDefaults.buttonColors(containerColor = green)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                    } else {
                        Icon(Icons.Default.CheckCircle, null, Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Got It!", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryScreen(
    state: QuestionPracticeUiState,
    green: Color,
    amber: Color,
    onRestart: () -> Unit,
    onBack: () -> Unit
) {
    val readiness = if (state.questions.isNotEmpty())
        (state.gotItCount * 100) / state.questions.size else 0
    val readinessColor = when {
        readiness >= 80 -> green
        readiness >= 50 -> amber
        else -> Color(0xFFC62828)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = readinessColor.copy(alpha = 0.10f),
            modifier = Modifier.size(100.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    if (readiness >= 80) Icons.Default.EmojiEvents else Icons.Default.Assessment,
                    contentDescription = null,
                    tint = readinessColor,
                    modifier = Modifier.size(52.dp)
                )
            }
        }
        Spacer(Modifier.height(20.dp))
        Text(
            "Session Complete!",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Your readiness score for this session",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(24.dp))

        // Score card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StatResultChip(
                        label = "Got It",
                        value = "${state.gotItCount}",
                        color = green,
                        icon = Icons.Default.CheckCircle,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(10.dp))
                    StatResultChip(
                        label = "Need Review",
                        value = "${state.needReviewCount}",
                        color = amber,
                        icon = Icons.Default.Refresh,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(10.dp))
                    StatResultChip(
                        label = "Readiness",
                        value = "$readiness%",
                        color = readinessColor,
                        icon = Icons.Default.TrendingUp,
                        modifier = Modifier.weight(1f)
                    )
                }
                LinearProgressIndicator(
                    progress = { readiness / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = readinessColor,
                    trackColor = readinessColor.copy(alpha = 0.15f)
                )
            }
        }

        Spacer(Modifier.height(28.dp))
        Button(
            onClick = onRestart,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(14.dp)
        ) {
            Icon(Icons.Default.Refresh, null, Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Practice Again", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().height(46.dp),
            shape = RoundedCornerShape(14.dp)
        ) {
            Icon(Icons.Default.ArrowBack, null, Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text("Back to Prep", fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun StatResultChip(
    label: String, value: String, color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.10f)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, null, Modifier.size(18.dp), tint = color)
            Spacer(Modifier.height(4.dp))
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = color)
            Text(label, style = MaterialTheme.typography.labelSmall, color = color.copy(0.8f))
        }
    }
}
