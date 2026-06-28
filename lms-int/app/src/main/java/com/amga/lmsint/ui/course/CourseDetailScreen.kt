package com.amga.lmsint.ui.course

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.amga.lmsint.data.model.Topic
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseDetailScreen(
    onBack: () -> Unit,
    onTopicClick: (String) -> Unit,
    vm: CourseDetailViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val totalTopics = state.topics.sumOf { 1 + it.subtopics.size }
    val completedCount = state.completedIds.size
    val progress = if (totalTopics > 0) completedCount.toFloat() / totalTopics else 0f
    val brandBlue = Color(0xFF1565C0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        state.courseTitle,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        maxLines = 1
                    )
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
                state.error != null -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.Warning, null,
                        tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(state.error ?: "Failed to load", color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = vm::load) { Text("Retry") }
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Course description
                    if (state.courseDescription.isNotBlank()) {
                        item {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    state.courseDescription,
                                    modifier = Modifier.padding(14.dp),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontSize = 15.sp,
                                    lineHeight = 22.sp
                                )
                            }
                        }
                    }

                    // Progress card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ),
                            elevation = CardDefaults.cardElevation(0.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "Your Progress",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        "${(progress * 100).roundToInt()}%",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = brandBlue
                                    )
                                }
                                Spacer(Modifier.height(10.dp))
                                LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp),
                                    color = brandBlue,
                                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    "$completedCount of $totalTopics topics completed",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }

                    // Topics
                    itemsIndexed(state.topics) { index, topic ->
                        TopicRow(
                            topic = topic,
                            chapterNumber = index + 1,
                            isExpanded = topic.id in state.expandedIds,
                            completedIds = state.completedIds,
                            onExpand = { vm.toggleExpand(topic.id) },
                            onLearn = onTopicClick,
                            onToggleComplete = { vm.toggleComplete(it) },
                            accentColor = brandBlue
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TopicRow(
    topic: Topic,
    chapterNumber: Int,
    isExpanded: Boolean,
    completedIds: Set<String>,
    onExpand: () -> Unit,
    onLearn: (String) -> Unit,
    onToggleComplete: (String) -> Unit,
    accentColor: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            TopicItem(
                title = topic.title,
                chapterLabel = "Chapter $chapterNumber",
                isCompleted = topic.id in completedIds,
                hasChildren = topic.subtopics.isNotEmpty(),
                isExpanded = isExpanded,
                onExpand = if (topic.subtopics.isNotEmpty()) onExpand else null,
                onLearn = { onLearn(topic.id) },
                onToggleComplete = { onToggleComplete(topic.id) },
                accentColor = accentColor,
                isSubtopic = false
            )
            AnimatedVisibility(visible = isExpanded) {
                Column {
                    topic.subtopics.forEach { sub ->
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 14.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                        TopicItem(
                            title = sub.title,
                            chapterLabel = null,
                            isCompleted = sub.id in completedIds,
                            hasChildren = false,
                            isExpanded = false,
                            onExpand = null,
                            onLearn = { onLearn(sub.id) },
                            onToggleComplete = { onToggleComplete(sub.id) },
                            accentColor = accentColor,
                            isSubtopic = true
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TopicItem(
    title: String,
    chapterLabel: String?,
    isCompleted: Boolean,
    hasChildren: Boolean,
    isExpanded: Boolean,
    onExpand: (() -> Unit)?,
    onLearn: () -> Unit,
    onToggleComplete: () -> Unit,
    accentColor: Color,
    isSubtopic: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isSubtopic) Modifier.padding(start = 16.dp) else Modifier)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onToggleComplete,
            modifier = Modifier.size(38.dp)
        ) {
            Icon(
                if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (isCompleted) accentColor else MaterialTheme.colorScheme.outlineVariant,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            if (chapterLabel != null) {
                Text(
                    chapterLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = accentColor,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 11.sp,
                    letterSpacing = 0.3.sp
                )
                Spacer(Modifier.height(1.dp))
            }
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (!isSubtopic) FontWeight.SemiBold else FontWeight.Normal,
                fontSize = if (!isSubtopic) 15.sp else 14.sp,
                color = if (isCompleted)
                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.50f)
                else
                    MaterialTheme.colorScheme.onSurface
            )
        }
        IconButton(
            onClick = onLearn,
            modifier = Modifier.size(38.dp)
        ) {
            Icon(
                Icons.Default.PlayArrow,
                contentDescription = "Learn",
                tint = accentColor,
                modifier = Modifier.size(22.dp)
            )
        }
        if (hasChildren) {
            IconButton(
                onClick = { onExpand?.invoke() },
                modifier = Modifier.size(38.dp)
            ) {
                Icon(
                    if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}
