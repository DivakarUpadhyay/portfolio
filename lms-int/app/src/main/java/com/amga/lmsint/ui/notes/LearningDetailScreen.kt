package com.amga.lmsint.ui.notes

import android.widget.TextView
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.amga.lmsint.ui.util.buildMarkwon
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LearningDetailScreen(
    onBack: () -> Unit,
    vm: LearningDetailViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val purple = Color(0xFF4527A0)
    val purpleDark = Color(0xFF311B92)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.topic?.title?.ifBlank { "Note" } ?: "Note",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 17.sp,
                        color = Color.White,
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = purpleDark)
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
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = vm::load) { Text("Retry") }
                }
                state.topic == null -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Article, null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(Modifier.height(12.dp))
                    Text("Note not found", style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                else -> {
                    val topic = state.topic!!
                    val dateStr = remember(topic.createdAt) {
                        runCatching {
                            val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply {
                                timeZone = TimeZone.getTimeZone("UTC")
                            }
                            val date = fmt.parse(topic.createdAt.take(19))
                            "Published " + SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date!!)
                        }.getOrElse { "" }
                    }

                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Title card
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = purple.copy(alpha = 0.08f)
                                ),
                                elevation = CardDefaults.cardElevation(0.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        topic.title,
                                        style = MaterialTheme.typography.headlineSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        fontSize = 22.sp,
                                        lineHeight = 30.sp
                                    )
                                    if (dateStr.isNotBlank()) {
                                        Spacer(Modifier.height(6.dp))
                                        Text(
                                            dateStr,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = purple.copy(alpha = 0.7f)
                                        )
                                    }
                                }
                            }
                        }

                        // Markdown content
                        item {
                            MarkdownContentCard(content = topic.content)
                        }

                        item { Spacer(Modifier.height(16.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun MarkdownContentCard(content: String) {
    val context = LocalContext.current
    val markwon = remember { buildMarkwon(context) }
    val textColorArgb = MaterialTheme.colorScheme.onSurface.toArgb()

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(1.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        AndroidView(
            factory = { ctx ->
                val dp = ctx.resources.displayMetrics.density
                TextView(ctx).also { tv ->
                    val h = (20 * dp).toInt()
                    val v = (18 * dp).toInt()
                    tv.setPadding(h, v, h, v)
                    tv.textSize = 19f
                    tv.setLineSpacing(3f * dp, 1.5f)
                    tv.movementMethod = android.text.method.LinkMovementMethod.getInstance()
                }
            },
            update = { tv ->
                tv.setTextColor(textColorArgb)
                markwon.setMarkdown(tv, content)
            },
            modifier = Modifier.fillMaxWidth()
        )
    }
}
