package com.amga.lmsint.ui.interview

import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InterviewPrepScreen(
    onBack: () -> Unit,
    onPractice: (String) -> Unit,
    vm: InterviewPrepViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val green = Color(0xFF2E7D32)
    val greenDark = Color(0xFF1B5E20)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Interview Prep",
                        fontWeight = FontWeight.Bold,
                        fontSize = 19.sp,
                        color = Color.White
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = greenDark)
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
                state.error != null -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Warning, null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(state.error ?: "Failed to load", color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = vm::load) { Text("Retry") }
                }
                state.totalQuestions == 0 -> Column(
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
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "No questions available yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "The admin will add interview questions to topics soon",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(bottom = 32.dp)
                ) {
                    // Overall readiness header
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Brush.verticalGradient(listOf(greenDark, green)))
                                .padding(horizontal = 20.dp, vertical = 20.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        "Overall Readiness",
                                        color = Color.White.copy(alpha = 0.85f),
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        "${state.overallReadiness}%",
                                        color = Color.White,
                                        fontSize = 36.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    LinearProgressIndicator(
                                        progress = { state.overallReadiness / 100f },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(8.dp)
                                            .clip(RoundedCornerShape(4.dp)),
                                        color = Color.White,
                                        trackColor = Color.White.copy(alpha = 0.25f)
                                    )
                                }
                                Spacer(Modifier.width(16.dp))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        "${state.totalQuestions}",
                                        color = Color.White,
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "total Q's",
                                        color = Color.White.copy(alpha = 0.80f),
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    // Group topics by course
                    val byCourse = state.topics.groupBy { it.courseTitle }
                    byCourse.forEach { (courseTitle, topics) ->
                        item {
                            Text(
                                courseTitle,
                                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 8.dp),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        items(topics) { info ->
                            TopicPracticeCard(
                                info = info,
                                green = green,
                                onPractice = { onPractice(info.topicId) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TopicPracticeCard(
    info: TopicPracticeInfo,
    green: Color,
    onPractice: () -> Unit
) {
    val readinessColor = when {
        info.readinessPercent >= 80 -> green
        info.readinessPercent >= 40 -> Color(0xFFE65100)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        info.topicTitle,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        "${info.totalQuestions} question${if (info.totalQuestions != 1) "s" else ""} · ${info.attemptedCount} attempted",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "${info.readinessPercent}%",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = readinessColor
                    )
                    Text(
                        "ready",
                        style = MaterialTheme.typography.labelSmall,
                        color = readinessColor.copy(alpha = 0.8f)
                    )
                }
            }
            LinearProgressIndicator(
                progress = { info.readinessPercent / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = readinessColor,
                trackColor = readinessColor.copy(alpha = 0.15f)
            )
            Button(
                onClick = onPractice,
                colors = ButtonDefaults.buttonColors(containerColor = green),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 7.dp),
                modifier = Modifier.fillMaxWidth().height(38.dp)
            ) {
                Icon(Icons.Default.PlayArrow, null, Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Practice", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
