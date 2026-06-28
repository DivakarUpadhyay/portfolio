package com.amga.lmsint.ui.topic

import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
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
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.amga.lmsint.data.model.ContentType
import com.amga.lmsint.data.model.TopicContent
import com.amga.lmsint.ui.util.buildMarkwon

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopicLearnScreen(
    onBack: () -> Unit,
    onPractice: () -> Unit = {},
    vm: TopicLearnViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val brandBlue = Color(0xFF1565C0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.topicTitle.ifBlank { "Learn" },
                        fontWeight = FontWeight.SemiBold,
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
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(52.dp)
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        state.error ?: "Failed to load content",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = vm::load) { Text("Retry") }
                }
                state.contents.isEmpty() -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(horizontal = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Article,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                        modifier = Modifier.size(72.dp)
                    )
                    Spacer(Modifier.height(14.dp))
                    Text(
                        "No content yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "The admin will add lessons, videos, and resources here soon",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    items(state.contents) { content ->
                        ContentBlock(content = content, accentColor = brandBlue)
                    }
                    if (state.hasInterviewQuestions) {
                        item {
                            Spacer(Modifier.height(4.dp))
                            Button(
                                onClick = onPractice,
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                            ) {
                                Icon(Icons.Default.Quiz, null, Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "Practice Interview Questions",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 15.sp
                                )
                            }
                        }
                    }
                    item { Spacer(Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
private fun ContentBlock(content: TopicContent, accentColor: Color) {
    val type = ContentType.from(content.type)
    Column(modifier = Modifier.fillMaxWidth()) {
        // Content type label
        Row(
            modifier = Modifier.padding(bottom = 7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = when (type) {
                    ContentType.TEXT -> Icons.Default.Article
                    ContentType.YOUTUBE -> Icons.Default.PlayCircle
                    ContentType.LINK -> Icons.Default.Link
                    ContentType.IMAGE -> Icons.Default.Image
                },
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(15.dp)
            )
            Spacer(Modifier.width(5.dp))
            Text(
                text = when (type) {
                    ContentType.TEXT -> "Lesson Content"
                    ContentType.YOUTUBE -> "Video Lesson"
                    ContentType.LINK -> "Resource Link"
                    ContentType.IMAGE -> "Screenshot / Diagram"
                },
                style = MaterialTheme.typography.labelMedium,
                color = accentColor,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.3.sp
            )
        }
        when (type) {
            ContentType.TEXT -> MarkdownBlock(content.body)
            ContentType.YOUTUBE -> YouTubeBlock(content.body)
            ContentType.LINK -> LinkBlock(content.body)
            ContentType.IMAGE -> ImageBlock(content.body)
        }
    }
}

@Composable
private fun MarkdownBlock(markdown: String) {
    val context = LocalContext.current
    val markwon = remember { buildMarkwon(context) }
    val textColorArgb = MaterialTheme.colorScheme.onSurface.toArgb()

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(1.dp),
        shape = RoundedCornerShape(12.dp),
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
                markwon.setMarkdown(tv, markdown)
            },
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun YouTubeBlock(videoIdOrUrl: String) {
    val videoId = extractYouTubeId(videoIdOrUrl)
    val html = """
        <html><body style="margin:0;padding:0;background:#000;">
        <iframe width="100%" height="100%"
        src="https://www.youtube.com/embed/$videoId"
        frameborder="0" allowfullscreen></iframe>
        </body></html>
    """.trimIndent()
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    webViewClient = WebViewClient()
                    settings.javaScriptEnabled = true
                    loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(230.dp)
        )
    }
}

@Composable
private fun LinkBlock(url: String) {
    val uriHandler = LocalUriHandler.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = { uriHandler.openUri(url) },
        elevation = CardDefaults.cardElevation(1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
            ) {
                Icon(
                    Icons.Default.Link,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .padding(10.dp)
                        .size(22.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "External Resource",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    url,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    maxLines = 2,
                    fontSize = 14.sp
                )
            }
            Icon(
                Icons.Default.OpenInNew,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun ImageBlock(imageUrl: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        AsyncImage(
            model = imageUrl,
            contentDescription = null,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 180.dp, max = 440.dp),
            contentScale = ContentScale.FillWidth
        )
    }
}

private fun extractYouTubeId(input: String): String {
    if (input.length == 11 && !input.contains("/")) return input
    val patterns = listOf("v=([^&]+)", "youtu\\.be/([^?]+)", "embed/([^?]+)")
    patterns.forEach { p ->
        Regex(p).find(input)?.groupValues?.getOrNull(1)?.let { return it }
    }
    return input
}
