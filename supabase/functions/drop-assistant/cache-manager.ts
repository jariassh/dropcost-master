import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
export async function getOrCreateCache(cacheKey: string, systemInstructionText: string, model: string = "models/gemini-1.5-flash-001") {
  try {
    // 1. Buscar en DB
    const { data: existingCache, error: _dbError } = await supabase
      .from('ai_caches')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (existingCache) {
      const isExpired = new Date(existingCache.expire_time) < new Date();
      if (!isExpired) {
        return existingCache.cache_name;
      }
      // Si expiró, lo borramos
      await supabase.from('ai_caches').delete().eq('id', existingCache.id);
    }

    console.log(`[CacheManager] Creando nuevo cache para: ${cacheKey}`);

    // 2. Crear en Google Gemini
    const ttlSeconds = 86400; // 24 horas
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        displayName: cacheKey.substring(0, 40), // Limitar longitud
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        ttl: `${ttlSeconds}s`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[CacheManager] Error creando cache en Google:", errorData);
      throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
    }

    const cacheData = await response.json();
    const cacheName = cacheData.name; // cachedContents/xxxxxx
    const expireTime = cacheData.expireTime;

    // 3. Guardar en DB
    await supabase.from('ai_caches').insert({
      cache_name: cacheName,
      cache_key: cacheKey,
      expire_time: expireTime
    });

    return cacheName;

  } catch (error) {
    console.error("[CacheManager] Error en getOrCreateCache:", error);
    return null; // Fallback: no usar cache
  }
}
