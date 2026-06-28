package com.amga.lmsint.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import com.amga.lmsint.data.model.Course

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onCourseClick: (String) -> Unit,
    onAdminClick: () -> Unit,
    onRecorderClick: () -> Unit,
    onRecordingsClick: () -> Unit,
    onInterviewPrepClick: () -> Unit = {},
    onLearningNotesClick: () -> Unit = {},
    onLogout: () -> Unit,
    vm: HomeViewModel = hiltViewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val brandBlue = Color(0xFF1565C0)
    val brandBlueDark = Color(0xFF0D47A1)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "LMS Interactive",
                        fontWeight = FontWeight.Bold,
                        fontSize = 19.sp,
                        color = Color.White
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = brandBlueDark,
                    actionIconContentColor = Color.White
                ),
                actions = {
                    if (state.isAdmin) {
                        IconButton(onClick = onAdminClick) {
                            Icon(Icons.Default.AdminPanelSettings, contentDescription = "Admin Panel")
                        }
                    }
                    IconButton(onClick = onRecorderClick) {
                        Icon(Icons.Default.Mic, contentDescription = "Record")
                    }
                    IconButton(onClick = onRecordingsClick) {
                        Icon(Icons.Default.FolderOpen, contentDescription = "My Recordings")
                    }
                    IconButton(onClick = { vm.logout(); onLogout() }) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
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
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        state.error ?: "Something went wrong",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = vm::load) { Text("Retry") }
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(bottom = 32.dp)
                ) {
                    item {
                        WelcomeCard(
                            userName = state.userName,
                            isAdmin = state.isAdmin,
                            brandBlue = brandBlue,
                            brandBlueDark = brandBlueDark
                        )
                    }
                    item {
                        InterviewPrepCard(onClick = onInterviewPrepClick)
                    }
                    item {
                        LearningNotesCard(onClick = onLearningNotesClick)
                    }
                    item {
                        Row(
                            modifier = Modifier.padding(
                                start = 16.dp, end = 16.dp, top = 20.dp, bottom = 10.dp
                            ),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "My Courses",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = brandBlue.copy(alpha = 0.12f)
                            ) {
                                Text(
                                    "${state.courses.size}",
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = brandBlue,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                    if (state.courses.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 40.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.MenuBook,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                                    modifier = Modifier.size(72.dp)
                                )
                                Spacer(Modifier.height(14.dp))
                                Text(
                                    "No courses available yet",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Check back soon for new learning content",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
                                )
                            }
                        }
                    } else {
                        items(state.courses, key = { it.id }) { course ->
                            CourseCard(
                                course = course,
                                accentColor = brandBlue,
                                onClick = { onCourseClick(course.id) }
                            )
                            Spacer(Modifier.height(12.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LearningNotesCard(onClick: () -> Unit) {
    val purple = Color(0xFF4527A0)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(purple)
            )
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = purple.copy(alpha = 0.12f)
                ) {
                    Icon(
                        Icons.Default.MenuBook,
                        contentDescription = null,
                        tint = purple,
                        modifier = Modifier
                            .padding(10.dp)
                            .size(24.dp)
                    )
                }
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Learning Notes",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        "Markdown articles · Read anytime",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp
                    )
                }
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = purple
                )
            }
        }
    }
}

@Composable
private fun InterviewPrepCard(onClick: () -> Unit) {
    val green = Color(0xFF2E7D32)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(green)
            )
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = green.copy(alpha = 0.12f)
                ) {
                    Icon(
                        Icons.Default.Quiz,
                        contentDescription = null,
                        tint = green,
                        modifier = Modifier
                            .padding(10.dp)
                            .size(24.dp)
                    )
                }
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Interview Prep",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        "Flashcard Q&A · Track your readiness",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp
                    )
                }
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = green
                )
            }
        }
    }
}

@Composable
private fun WelcomeCard(
    userName: String,
    isAdmin: Boolean,
    brandBlue: Color,
    brandBlueDark: Color
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Brush.verticalGradient(listOf(brandBlueDark, brandBlue)))
            .padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.22f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = userName.firstOrNull()?.uppercase() ?: "U",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(
                    "Welcome back,",
                    color = Color.White.copy(alpha = 0.80f),
                    fontSize = 14.sp,
                    letterSpacing = 0.2.sp
                )
                Text(
                    userName.ifBlank { "Learner" },
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                if (isAdmin) {
                    Spacer(Modifier.height(6.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color.White.copy(alpha = 0.22f)
                    ) {
                        Text(
                            "Admin",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CourseCard(
    course: Course,
    accentColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
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
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                Text(
                    course.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                )
                if (course.description.isNotBlank()) {
                    Spacer(Modifier.height(5.dp))
                    Text(
                        course.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        fontSize = 14.sp
                    )
                }
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.MenuBook,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.width(5.dp))
                    Text(
                        "Tap to start learning",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.weight(1f))
                    Icon(
                        Icons.Default.ChevronRight,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = accentColor
                    )
                }
            }
        }
    }
}
