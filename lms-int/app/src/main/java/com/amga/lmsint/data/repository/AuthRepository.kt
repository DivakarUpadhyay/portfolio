package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.Profile
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.JsonPrimitive
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(private val supabase: SupabaseClient) {

    val sessionFlow = supabase.auth.sessionStatus

    suspend fun login(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun logout() = supabase.auth.signOut()

    fun currentUserId(): String? = supabase.auth.currentUserOrNull()?.id

    suspend fun currentProfile(): Profile? {
        val uid = currentUserId() ?: return null
        return supabase.postgrest["profiles"]
            .select { filter { eq("id", uid) } }
            .decodeSingleOrNull<Profile>()
    }

    suspend fun isAdmin(): Boolean = currentProfile()?.role == "admin"

    suspend fun createUser(email: String, password: String, name: String) {
        supabase.auth.admin.createUserWithEmail {
            this.email = email
            this.password = password
            userMetadata = buildJsonObject { put("name", JsonPrimitive(name)) }
        }
    }

    suspend fun allProfiles(): List<Profile> =
        supabase.postgrest["profiles"].select().decodeList<Profile>()

    suspend fun updateRole(userId: String, role: String) {
        supabase.postgrest["profiles"].update({ set("role", role) }) {
            filter { eq("id", userId) }
        }
    }
}

private fun buildJsonObject(block: kotlinx.serialization.json.JsonObjectBuilder.() -> Unit) =
    kotlinx.serialization.json.buildJsonObject(block)
