package com.amga.lmsint.ui.navigation

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Home : Screen("home")
    data object CourseDetail : Screen("course/{courseId}") {
        fun createRoute(courseId: String) = "course/$courseId"
    }
    data object TopicLearn : Screen("topic/{topicId}") {
        fun createRoute(topicId: String) = "topic/$topicId"
    }
    data object Recorder : Screen("recorder")
    data object Recordings : Screen("recordings")

    // Admin
    data object AdminCourses : Screen("admin/courses")
    data object AdminTopics : Screen("admin/topics/{courseId}") {
        fun createRoute(courseId: String) = "admin/topics/$courseId"
    }
    data object AdminContent : Screen("admin/content/{topicId}") {
        fun createRoute(topicId: String) = "admin/content/$topicId"
    }
    data object AdminUsers : Screen("admin/users")
    data object AdminQuestions : Screen("admin/questions/{topicId}") {
        fun createRoute(topicId: String) = "admin/questions/$topicId"
    }

    // Interview Prep
    data object InterviewPrep : Screen("interview_prep")
    data object QuestionPractice : Screen("practice/{topicId}") {
        fun createRoute(topicId: String) = "practice/$topicId"
    }

    // Learning Notes (from portfolio Topics admin)
    data object LearningCatalog : Screen("learning_notes")
    data object LearningDetail : Screen("learning_notes/{slug}") {
        fun createRoute(slug: String) = "learning_notes/$slug"
    }
}
