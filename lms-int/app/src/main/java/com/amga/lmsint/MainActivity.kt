package com.amga.lmsint

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.amga.lmsint.ui.navigation.LmsNavGraph
import com.amga.lmsint.ui.theme.LmsIntTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LmsIntTheme {
                LmsNavGraph()
            }
        }
    }
}
