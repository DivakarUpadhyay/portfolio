package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.Recording
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.storage.storage
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class RecordingRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun myRecordings(): List<Recording> {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return emptyList()
        return supabase.postgrest["recordings"]
            .select {
                filter { eq("user_id", uid) }
                order("created_at", Order.DESCENDING)
            }
            .decodeList<Recording>()
    }

    suspend fun uploadAndSave(file: File, title: String, durationSeconds: Int): Recording {
        val uid = supabase.auth.currentUserOrNull()?.id
            ?: error("Not authenticated")
        val storagePath = "$uid/${file.name}"

        supabase.storage.from("recordings").upload(storagePath, file.readBytes()) {
            upsert = false
        }

        supabase.postgrest["recordings"].insert(
            buildJsonObject {
                put("user_id", uid)
                put("title", title)
                put("file_path", storagePath)
                put("duration_seconds", durationSeconds)
            }
        )
        return supabase.postgrest["recordings"]
            .select { filter { eq("file_path", storagePath) } }
            .decodeSingle<Recording>()
    }

    suspend fun getDownloadUrl(filePath: String): String =
        supabase.storage.from("recordings").createSignedUrl(filePath, 3600.seconds)

    suspend fun delete(recording: Recording) {
        supabase.storage.from("recordings").delete(recording.filePath)
        supabase.postgrest["recordings"].delete { filter { eq("id", recording.id) } }
    }
}
