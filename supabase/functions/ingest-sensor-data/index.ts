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

    // ── Weight drop detection ──
    let weightAlertType: string | null = null;
    let weightAlertMessage: string | null = null;

    if (data.weight != null) {
      // Fetch the last 3 readings (excluding the one we just inserted) to compare
      const { data: recentReadings } = await supabase
        .from("sensor_readings")
        .select("weight, recorded_at")
        .eq("hive_id", hive.id)
        .not("weight", "is", null)
        .order("recorded_at", { ascending: false })
        .limit(4); // current + 3 previous

      if (recentReadings && recentReadings.length >= 2) {
        const current = recentReadings[0];
        const prev1 = recentReadings[1];

        const drop1 = (prev1.weight as number) - (current.weight as number);

        // Rapid Weight Drop: ≥1.0 kg between two consecutive readings
        if (drop1 >= 1.0) {
          weightAlertType = "critical";
          weightAlertMessage = `🚨 Snabb viktminskning! -${drop1.toFixed(1)} kg på ~5 min (${(prev1.weight as number).toFixed(1)} → ${(current.weight as number).toFixed(1)} kg)`;
        }

        // Possible Swarm: ≥1.0 kg over 3 consecutive readings (ignore <0.2 kg noise)
        if (!weightAlertType && recentReadings.length >= 3) {
          const prev2 = recentReadings[2];
          const drop12 = (prev2.weight as number) - (prev1.weight as number);
          const totalDrop = (prev2.weight as number) - (current.weight as number);

          // Both individual drops must be > noise threshold (0.2 kg)
          if (totalDrop >= 1.0 && drop12 > 0.2 && drop1 > 0.2) {
            weightAlertType = "alarm";
            weightAlertMessage = `⚠️ Möjlig svärmning! Vikten har minskat ${totalDrop.toFixed(1)} kg över 3 mätningar (${(prev2.weight as number).toFixed(1)} → ${(current.weight as number).toFixed(1)} kg)`;
          }
        }
      }
    }

    // ── Swarm score alerts ──
    let newStatus: "ok" | "warning" | "alarm" = "ok";
    let alertCreated = false;

    if (weightAlertType === "critical") {
      newStatus = "alarm";
      await supabase.from("alerts").insert({
        hive_id: hive.id,
        user_id: hive.user_id,
        alert_type: "critical",
        message: weightAlertMessage,
      });
      alertCreated = true;
    } else if (weightAlertType === "alarm") {
      newStatus = "alarm";
      await supabase.from("alerts").insert({
        hive_id: hive.id,
        user_id: hive.user_id,
        alert_type: "alarm",
        message: weightAlertMessage,
      });
      alertCreated = true;
    }

    if (data.swarm_score !== undefined) {
      const WARN_THRESHOLD = 50;
      const ALARM_THRESHOLD = 80;

      if (data.swarm_score >= ALARM_THRESHOLD) {
        if (newStatus !== "alarm") newStatus = "alarm";
        
        await supabase.from("alerts").insert({
          hive_id: hive.id,
          user_id: hive.user_id,
          alert_type: "alarm",
          message: `🚨 Hög svärmrisk! Score: ${data.swarm_score.toFixed(0)}`,
        });
        alertCreated = true;

      } else if (data.swarm_score >= WARN_THRESHOLD) {
        if (newStatus === "ok") newStatus = "warning";
        
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
