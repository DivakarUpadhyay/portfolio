package com.amga.lmsint.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.MediaRecorder
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.amga.lmsint.LmsApp
import com.amga.lmsint.MainActivity
import com.amga.lmsint.R
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class RecordingService : Service() {

    private val binder = RecordingBinder()
    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null
    private var startTime: Long = 0L
    var isRecording = false
        private set

    inner class RecordingBinder : Binder() {
        fun getService(): RecordingService = this@RecordingService
    }

    override fun onBind(intent: Intent): IBinder = binder

    fun startRecording(outputDir: File): File {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val file = File(outputDir, "REC_$timestamp.m4a")
        outputFile = file
        startTime = System.currentTimeMillis()

        recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(44100)
            setAudioEncodingBitRate(128000)
            setOutputFile(file.absolutePath)
            prepare()
            start()
        }

        isRecording = true
        startForeground(NOTIFICATION_ID, buildNotification())
        return file
    }

    fun stopRecording(): Pair<File, Int>? {
        if (!isRecording) return null
        val duration = ((System.currentTimeMillis() - startTime) / 1000).toInt()
        try {
            recorder?.stop()
        } catch (_: Exception) {}
        recorder?.release()
        recorder = null
        isRecording = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        return outputFile?.let { it to duration }
    }

    private fun buildNotification(): Notification {
        val tap = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, LmsApp.CHANNEL_RECORDING)
            .setContentTitle(getString(R.string.notification_recording_title))
            .setContentText(getString(R.string.notification_recording_text))
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(tap)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        stopRecording()
        super.onDestroy()
    }

    companion object {
        const val NOTIFICATION_ID = 1001
    }
}
