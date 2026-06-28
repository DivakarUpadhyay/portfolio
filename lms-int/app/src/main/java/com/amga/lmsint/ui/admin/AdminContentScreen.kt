package com.amga.lmsint.ui.admin

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.amga.lmsint.data.model.ContentType
import com.amga.lmsint.data.model.TopicContent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminContentScreen(
    onBack: () -> Unit,
    vm: AdminContentViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val bytes = context.contentResolver.openInputStream(it)?.readBytes() ?: return@let
            val mimeType = context.contentResolver.getType(it) ?: "image/jpeg"
            val rawExt = mimeType.substringAfter("/").substringBefore(";")
            val ext = if (rawExt == "jpeg") "jpg" else rawExt
            vm.uploadImage(bytes, "topic_${System.currentTimeMillis()}.$ext")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Topic Content", fontWeight = FontWeight.SemiBold) },
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
                text = { Text("Add Content") }
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
                state.contents.isEmpty() -> Column(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(horizontal = 32.dp),
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
                        "Tap \"Add Content\" to add markdown lessons, images, YouTube videos, or links",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.contents) { content ->
                        ContentItemCard(
                            content = content,
                            onEdit = { vm.openEdit(content) },
                            onDelete = { vm.delete(content) }
                        )
                    }
                    item { Spacer(Modifier.height(72.dp)) }
                }
            }

            // Error snackbar
            if (state.error != null) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.errorContainer,
                    shadowElevation = 4.dp
                ) {
                    Text(
                        state.error ?: "",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }

    if (state.showDialog) {
        ContentDialog(
            isEdit = state.editingContent != null,
            type = state.dialogType,
            body = state.dialogBody,
            isSaving = state.isSaving,
            isUploadingImage = state.isUploadingImage,
            onTypeChange = vm::onTypeChange,
            onBodyChange = vm::onBodyChange,
            onDismiss = vm::dismissDialog,
            onSave = vm::saveContent,
            onPickImage = { imagePicker.launch("image/*") }
        )
    }
}

@Composable
private fun ContentItemCard(
    content: TopicContent,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val type = ContentType.from(content.type)
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
            ) {
                Icon(
                    imageVector = when (type) {
                        ContentType.TEXT -> Icons.Default.Article
                        ContentType.YOUTUBE -> Icons.Default.PlayCircle
                        ContentType.LINK -> Icons.Default.Link
                        ContentType.IMAGE -> Icons.Default.Image
                    },
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .padding(9.dp)
                        .size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = when (type) {
                        ContentType.TEXT -> "Markdown Lesson"
                        ContentType.YOUTUBE -> "YouTube Video"
                        ContentType.LINK -> "Resource Link"
                        ContentType.IMAGE -> "Image / Screenshot"
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    content.body,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 3,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 13.sp
                )
            }
            IconButton(onClick = onEdit, modifier = Modifier.size(38.dp)) {
                Icon(
                    Icons.Default.Edit,
                    contentDescription = "Edit",
                    modifier = Modifier.size(18.dp)
                )
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(38.dp)) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun ContentDialog(
    isEdit: Boolean,
    type: ContentType,
    body: String,
    isSaving: Boolean,
    isUploadingImage: Boolean,
    onTypeChange: (ContentType) -> Unit,
    onBodyChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit,
    onPickImage: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isSaving && !isUploadingImage) onDismiss() },
        title = {
            Text(
                if (isEdit) "Edit Content" else "Add Content",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Type selector
                Text(
                    "Content Type",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    ContentType.entries.forEach { t ->
                        FilterChip(
                            selected = type == t,
                            onClick = { onTypeChange(t) },
                            label = {
                                Text(
                                    when (t) {
                                        ContentType.TEXT -> "Markdown"
                                        ContentType.YOUTUBE -> "YouTube"
                                        ContentType.LINK -> "Link"
                                        ContentType.IMAGE -> "Image"
                                    },
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        )
                    }
                }

                HorizontalDivider()

                // Body input
                OutlinedTextField(
                    value = body,
                    onValueChange = onBodyChange,
                    label = {
                        Text(
                            when (type) {
                                ContentType.TEXT -> "Markdown Content"
                                ContentType.YOUTUBE -> "YouTube URL or Video ID"
                                ContentType.LINK -> "Resource URL"
                                ContentType.IMAGE -> "Image URL (or upload below)"
                            }
                        )
                    },
                    placeholder = {
                        Text(
                            when (type) {
                                ContentType.TEXT -> "# Introduction to Inheritance\n\nInheritance allows a class to...\n\n**Key points:**\n- Point 1\n- Point 2\n\n```java\nclass Dog extends Animal { }\n```"
                                ContentType.YOUTUBE -> "https://www.youtube.com/watch?v=..."
                                ContentType.LINK -> "https://docs.example.com/topic"
                                ContentType.IMAGE -> "https://..."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    },
                    minLines = if (type == ContentType.TEXT) 9 else 3,
                    maxLines = if (type == ContentType.TEXT) 16 else 5,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                // Markdown tip
                if (type == ContentType.TEXT) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ) {
                        Text(
                            "Markdown: # Heading  **bold**  *italic*  `code`  - list  ``` code block ```",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 11.sp
                        )
                    }
                }

                // Image upload button
                if (type == ContentType.IMAGE) {
                    if (isUploadingImage) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                            Text(
                                "Uploading image to cloud…",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        OutlinedButton(
                            onClick = onPickImage,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(
                                Icons.Default.CloudUpload,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "Pick Image from Device",
                                style = MaterialTheme.typography.labelLarge
                            )
                        }
                        if (body.startsWith("http")) {
                            Text(
                                "Image uploaded successfully. URL filled above.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onSave,
                enabled = body.isNotBlank() && !isSaving && !isUploadingImage,
                shape = RoundedCornerShape(8.dp)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(Modifier.width(6.dp))
                }
                Text("Save", fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isSaving && !isUploadingImage
            ) {
                Text("Cancel")
            }
        }
    )
}
