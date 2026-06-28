package com.amga.lmsint.ui.recorder

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amga.lmsint.data.repository.RecordingRepository
import com.amga.lmsint.service.RecordingService
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class RecorderUiState(
    val isRecording: Boolean = false,
    val elapsedSeconds: Int = 0,
    val isUploading: Boolean = false,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class RecorderViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val recordingRepo: RecordingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RecorderUiState())
    val uiState = _uiState.asStateFlow()

    private var recordingService: RecordingService? = null
    private var ticker: kotlinx.coroutines.Job? = null

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            recordingService = (binder as RecordingService.RecordingBinder).getService()
            _uiState.value = _uiState.value.copy(isRecording = recordingService?.isRecording == true)
        }
        override fun onServiceDisconnected(name: ComponentName?) { recordingService = null }
    }

    init {
        Intent(context, RecordingService::class.java).also { intent ->
            context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }
    }

    fun startRecording() {
        val outputDir = File(context.filesDir, "recordings").also { it.mkdirs() }
        recordingService?.startRecording(outputDir)
        _uiState.value = _uiState.value.copy(isRecording = true, elapsedSeconds = 0, message = null, error = null)
        ticker = viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(1000)
                _uiState.value = _uiState.value.copy(elapsedSeconds = _uiState.value.elapsedSeconds + 1)
            }
        }
    }

    fun stopAndUpload(title: String) = viewModelScope.launch {
        ticker?.cancel()
        val result = recordingService?.stopRecording() ?: return@launch
        val (file, duration) = result
        _uiState.value = _uiState.value.copy(isRecording = false, isUploading = true)
        runCatching { recordingRepo.uploadAndSave(file, title.ifBlank { file.name }, duration) }
            .onSuccess { _uiState.value = _uiState.value.copy(isUploading = false, message = "Saved: ${it.title}") }
            .onFailure { _uiState.value = _uiState.value.copy(isUploading = false, error = it.message) }
        file.delete()
    }

    override fun onCleared() {
        context.unbindService(connection)
        super.onCleared()
    }
}
