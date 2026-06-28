package com.amga.lmsint.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.amga.lmsint.ui.admin.AdminContentScreen
import com.amga.lmsint.ui.admin.AdminCoursesScreen
import com.amga.lmsint.ui.admin.AdminQuestionsScreen
import com.amga.lmsint.ui.admin.AdminTopicsScreen
import com.amga.lmsint.ui.admin.AdminUsersScreen
import com.amga.lmsint.ui.auth.LoginScreen
import com.amga.lmsint.ui.course.CourseDetailScreen
import com.amga.lmsint.ui.home.HomeScreen
import com.amga.lmsint.ui.interview.InterviewPrepScreen
import com.amga.lmsint.ui.interview.QuestionPracticeScreen
import com.amga.lmsint.ui.notes.LearningCatalogScreen
import com.amga.lmsint.ui.notes.LearningDetailScreen
import com.amga.lmsint.ui.recorder.RecorderScreen
import com.amga.lmsint.ui.recordings.RecordingsScreen
import com.amga.lmsint.ui.topic.TopicLearnScreen

@Composable
fun LmsNavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Screen.Login.route) {

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { _ ->
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onCourseClick = { navController.navigate(Screen.CourseDetail.createRoute(it)) },
                onAdminClick = { navController.navigate(Screen.AdminCourses.route) },
                onRecorderClick = { navController.navigate(Screen.Recorder.route) },
                onRecordingsClick = { navController.navigate(Screen.Recordings.route) },
                onInterviewPrepClick = { navController.navigate(Screen.InterviewPrep.route) },
                onLearningNotesClick = { navController.navigate(Screen.LearningCatalog.route) },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(
            Screen.CourseDetail.route,
            arguments = listOf(navArgument("courseId") { type = NavType.StringType })
        ) {
            CourseDetailScreen(
                onBack = { navController.popBackStack() },
                onTopicClick = { navController.navigate(Screen.TopicLearn.createRoute(it)) }
            )
        }

        composable(
            Screen.TopicLearn.route,
            arguments = listOf(navArgument("topicId") { type = NavType.StringType })
        ) { backStackEntry ->
            val topicId = backStackEntry.arguments?.getString("topicId") ?: ""
            TopicLearnScreen(
                onBack = { navController.popBackStack() },
                onPractice = { navController.navigate(Screen.QuestionPractice.createRoute(topicId)) }
            )
        }

        composable(Screen.Recorder.route) {
            RecorderScreen(
                onBack = { navController.popBackStack() },
                onViewRecordings = { navController.navigate(Screen.Recordings.route) }
            )
        }

        composable(Screen.Recordings.route) {
            RecordingsScreen(onBack = { navController.popBackStack() })
        }

        // Interview Prep
        composable(Screen.InterviewPrep.route) {
            InterviewPrepScreen(
                onBack = { navController.popBackStack() },
                onPractice = { navController.navigate(Screen.QuestionPractice.createRoute(it)) }
            )
        }

        composable(
            Screen.QuestionPractice.route,
            arguments = listOf(navArgument("topicId") { type = NavType.StringType })
        ) {
            QuestionPracticeScreen(onBack = { navController.popBackStack() })
        }

        // Learning Notes
        composable(Screen.LearningCatalog.route) {
            LearningCatalogScreen(
                onBack = { navController.popBackStack() },
                onTopicClick = { navController.navigate(Screen.LearningDetail.createRoute(it)) }
            )
        }

        composable(
            Screen.LearningDetail.route,
            arguments = listOf(navArgument("slug") { type = NavType.StringType })
        ) {
            LearningDetailScreen(onBack = { navController.popBackStack() })
        }

        // Admin screens
        composable(Screen.AdminCourses.route) {
            AdminCoursesScreen(
                onBack = { navController.popBackStack() },
                onManageTopics = { navController.navigate(Screen.AdminTopics.createRoute(it)) },
                onManageUsers = { navController.navigate(Screen.AdminUsers.route) }
            )
        }

        composable(
            Screen.AdminTopics.route,
            arguments = listOf(navArgument("courseId") { type = NavType.StringType })
        ) {
            AdminTopicsScreen(
                onBack = { navController.popBackStack() },
                onManageContent = { navController.navigate(Screen.AdminContent.createRoute(it)) },
                onManageQuestions = { navController.navigate(Screen.AdminQuestions.createRoute(it)) }
            )
        }

        composable(
            Screen.AdminContent.route,
            arguments = listOf(navArgument("topicId") { type = NavType.StringType })
        ) {
            AdminContentScreen(onBack = { navController.popBackStack() })
        }

        composable(
            Screen.AdminQuestions.route,
            arguments = listOf(navArgument("topicId") { type = NavType.StringType })
        ) {
            AdminQuestionsScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.AdminUsers.route) {
            AdminUsersScreen(onBack = { navController.popBackStack() })
        }
    }
}
