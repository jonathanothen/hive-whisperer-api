import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SensorData {
  device_id: string;
  temperature?: number;
  humidity?: number;
  weight?: number;
  sound_rms?: number;
  swarm_score?: number;
  // Audio analysis fields
  dbfs?: number;
  band_hum?: number;
  band_piping?: number;
  band_swarm?: number;
  band_hiss?: number;
  peak_freq?: number;
  piping_ratio?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: SensorData = await req.json();

    if (!data.device_id) {
      return new Response(
        JSON.stringify({ error: "device_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate sensor data - reject obvious sensor failures
    // DHT sensors often return 0/0 when they fail to read
    const isInvalidReading = 
      (data.temperature === 0 && data.humidity === 0) ||
      (data.temperature !== undefined && (data.temperature < -40 || data.temperature > 80)) ||
      (data.humidity !== undefined && (data.humidity < 0 || data.humidity > 100));

    if (isInvalidReading) {
      console.log("Rejected invalid sensor reading:", data);
      return new Response(
        JSON.stringify({ 
          error: "Invalid sensor reading - values outside plausible range",
          rejected: true,
          device_id: data.device_id 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert device — auto-register on first contact
    const { error: deviceError } = await supabase
      .from("devices")
      .upsert(
        { device_id: data.device_id, last_seen: new Date().toISOString() },
        { onConflict: "device_id" }
      );

    if (deviceError) {
      console.error("Error upserting device:", deviceError);
    }

    // Find the hive by device_id
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, user_id")
      .eq("device_id", data.device_id)
      .single();

    if (hiveError || !hive) {
      // Device registered but no hive linked yet — that's OK
      return new Response(
        JSON.stringify({ 
          success: true, 
          device_registered: true,
          hive_linked: false,
          device_id: data.device_id,
          message: "Device registered but not yet linked to a hive" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert sensor reading and update last_seen on hive
    const [{ error: insertError }, { error: updateError }] = await Promise.all([
      supabase.from("sensor_readings").insert({
        hive_id: hive.id,
        temperature: data.temperature,
        humidity: data.humidity,
        weight: data.weight,
        sound_rms: data.sound_rms,
        swarm_score: data.swarm_score,
        dbfs: data.dbfs,
        band_hum: data.band_hum,
        band_piping: data.band_piping,
        band_swarm: data.band_swarm,
        band_hiss: data.band_hiss,
        peak_freq: data.peak_freq,
        piping_ratio: data.piping_ratio,
      }),
      supabase.from("hives").update({ last_seen: new Date().toISOString() }).eq("id", hive.id)
    ]);

    if (updateError) {
      console.error("Error updating last_seen:", updateError);
    }

    if (insertError) {
      console.error("Error inserting sensor reading:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert sensor reading" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for swarm alerts
    let newStatus: "ok" | "warning" | "alarm" = "ok";
    let alertCreated = false;

    if (data.swarm_score !== undefined) {
      const WARN_THRESHOLD = 50;
      const ALARM_THRESHOLD = 80;

      if (data.swarm_score >= ALARM_THRESHOLD) {
        newStatus = "alarm";
        
        // Create alarm alert
        await supabase.from("alerts").insert({
          hive_id: hive.id,
          user_id: hive.user_id,
          alert_type: "alarm",
          message: `🚨 Hög svärmrisk! Score: ${data.swarm_score.toFixed(0)}`,
        });
        alertCreated = true;

      } else if (data.swarm_score >= WARN_THRESHOLD) {
        newStatus = "warning";
        
        // Create warning alert
        await supabase.from("alerts").insert({
          hive_id: hive.id,
          user_id: hive.user_id,
          alert_type: "warning",
          message: `⚠️ Förhöjd svärmrisk. Score: ${data.swarm_score.toFixed(0)}`,
        });
        alertCreated = true;
      }
    }

    // Update hive status if changed
    const { data: currentHive } = await supabase
      .from("hives")
      .select("status")
      .eq("id", hive.id)
      .single();

    if (currentHive && currentHive.status !== newStatus) {
      await supabase
        .from("hives")
        .update({ status: newStatus })
        .eq("id", hive.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        hive_id: hive.id,
        status: newStatus,
        alert_created: alertCreated
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
