package com.amga.lmsint.data.repository

import com.amga.lmsint.data.model.PortfolioDataEntry
import com.amga.lmsint.data.model.TopicValue
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LearningNotesRepository @Inject constructor(private val supabase: SupabaseClient) {

    suspend fun allTopics(): List<TopicValue> =
        supabase.postgrest["portfolio_data"]
            .select { filter { like("key", "topic_%") } }
            .decodeList<PortfolioDataEntry>()
            .map { it.value }
            .filter { it.active }
            .sortedByDescending { it.createdAt }

    suspend fun getTopic(slug: String): TopicValue? =
        supabase.postgrest["portfolio_data"]
            .select { filter { eq("key", "topic_$slug") } }
            .decodeSingleOrNull<PortfolioDataEntry>()
            ?.value
}
