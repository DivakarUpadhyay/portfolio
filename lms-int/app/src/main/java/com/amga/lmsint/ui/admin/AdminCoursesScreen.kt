package com.amga.lmsint.ui.admin

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.amga.lmsint.data.model.Course

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminCoursesScreen(
    onBack: () -> Unit,
    onManageTopics: (String) -> Unit,
    onManageUsers: () -> Unit,
    vm: AdminCoursesViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    var deleteTarget by remember { mutableStateOf<Course?>(null) }

    val brandBlue = Color(0xFF1565C0)
    val brandBlueDark = Color(0xFF0D47A1)
    val publishedCount = state.courses.count { it.isPublished }
    val draftCount = state.courses.count { !it.isPublished }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Admin Panel",
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
                colors = TopAppBarDefaults.topAppBarColors(containerColor = brandBlueDark),
                actions = {
                    IconButton(onClick = onManageUsers) {
                        Icon(Icons.Default.People, contentDescription = "Manage Users", tint = Color.White)
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = vm::openAddDialog,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("New Course", fontWeight = FontWeight.SemiBold) },
                containerColor = brandBlue,
                contentColor = Color.White
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
                else -> LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Stats row
                    if (state.courses.isNotEmpty()) {
                        item {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                StatChip(
                                    label = "Total",
                                    value = "${state.courses.size}",
                                    color = brandBlue,
                                    modifier = Modifier.weight(1f)
                                )
                                StatChip(
                                    label = "Published",
                                    value = "$publishedCount",
                                    color = Color(0xFF2E7D32),
                                    modifier = Modifier.weight(1f)
                                )
                                StatChip(
                                    label = "Drafts",
                                    value = "$draftCount",
                                    color = Color(0xFF6D4C41),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    if (state.courses.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 48.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.LibraryBooks, null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                                    modifier = Modifier.size(72.dp)
                                )
                                Spacer(Modifier.height(14.dp))
                                Text(
                                    "No courses yet",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Tap \"New Course\" to create your first course",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
                                )
                            }
                        }
                    } else {
                        items(state.courses, key = { it.id }) { course ->
                            AdminCourseCard(
                                course = course,
                                brandBlue = brandBlue,
                                onEdit = { vm.openEditDialog(course) },
                                onTogglePublish = { vm.togglePublish(course) },
                                onTopics = { onManageTopics(course.id) },
                                onDelete = { deleteTarget = course }
                            )
                        }
                    }

                    item { Spacer(Modifier.height(72.dp)) }
                }
            }
        }
    }

    // Add / Edit dialog
    if (state.showAddDialog) {
        CourseDialog(
            isEdit = state.editingCourse != null,
            name = state.dialogTitle,
            description = state.dialogDescription,
            isSaving = state.isSaving,
            onNameChange = vm::onDialogTitleChange,
            onDescChange = vm::onDialogDescChange,
            onDismiss = vm::dismissDialog,
            onSave = vm::saveCourse
        )
    }

    // Delete confirmation
    deleteTarget?.let { course ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            icon = {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                )
            },
            title = {
                Text("Delete Course?", fontWeight = FontWeight.Bold)
            },
            text = {
                Text(
                    "\"${course.title}\" and all its topics and content will be permanently deleted. This cannot be undone.",
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = 22.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = { vm.deleteCourse(course); deleteTarget = null },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Delete", fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { deleteTarget = null },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun StatChip(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.10f)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                value,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                color = color
            )
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = color.copy(alpha = 0.8f),
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun AdminCourseCard(
    course: Course,
    brandBlue: Color,
    onEdit: () -> Unit,
    onTogglePublish: () -> Unit,
    onTopics: () -> Unit,
    onDelete: () -> Unit
) {
    val accentColor = if (course.isPublished) brandBlue else Color(0xFF78909C)

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(accentColor)
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Title + badge row
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        course.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (course.isPublished)
                            Color(0xFF2E7D32).copy(alpha = 0.12f)
                        else
                            Color(0xFF78909C).copy(alpha = 0.12f)
                    ) {
                        Text(
                            if (course.isPublished) "Published" else "Draft",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = if (course.isPublished) Color(0xFF2E7D32) else Color(0xFF546E7A)
                        )
                    }
                }

                // Description
                if (course.description.isNotBlank()) {
                    Text(
                        course.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        fontSize = 13.sp
                    )
                }

                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 4.dp),
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                )

                // Action row
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Button(
                        onClick = onTopics,
                        colors = ButtonDefaults.buttonColors(containerColor = brandBlue),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.List, null, Modifier.size(15.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(
                            "Topics",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(Modifier.weight(1f))

                    // Edit
                    IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                        Icon(
                            Icons.Default.Edit, contentDescription = "Edit",
                            modifier = Modifier.size(19.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    // Publish toggle
                    IconButton(onClick = onTogglePublish, modifier = Modifier.size(36.dp)) {
                        Icon(
                            if (course.isPublished) Icons.Default.VisibilityOff
                            else Icons.Default.Visibility,
                            contentDescription = if (course.isPublished) "Unpublish" else "Publish",
                            modifier = Modifier.size(19.dp),
                            tint = if (course.isPublished) Color(0xFF2E7D32) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    // Delete
                    IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                        Icon(
                            Icons.Default.Delete, contentDescription = "Delete",
                            modifier = Modifier.size(19.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CourseDialog(
    isEdit: Boolean,
    name: String,
    description: String,
    isSaving: Boolean,
    onNameChange: (String) -> Unit,
    onDescChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        title = {
            Text(
                if (isEdit) "Edit Course" else "New Course",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = onNameChange,
                    label = { Text("Course Title") },
                    placeholder = { Text("e.g. Java Programming", style = MaterialTheme.typography.bodySmall) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = onDescChange,
                    label = { Text("Description") },
                    placeholder = {
                        Text(
                            "Brief overview of what this course covers...",
                            style = MaterialTheme.typography.bodySmall
                        )
                    },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onSave,
                enabled = name.isNotBlank() && !isSaving,
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
                Text(if (isEdit) "Update" else "Create", fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                enabled = !isSaving,
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Cancel")
            }
        }
    )
}
