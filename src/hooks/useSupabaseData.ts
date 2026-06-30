import { useState, useCallback } from "react";
import { supabase, IS_LIVE, type DbRegistrant, type DbActivity, type DbMentor, type DbMentorAssignment, type DbActivityType } from "@/lib/supabase";

const IS_DEMO = !IS_LIVE;

// Activity Types - always from seed data (24 types)
const ACTIVITY_TYPES: DbActivityType[] = [
  { id: 1, number: 1, name: "Diksar", points: 25, requires_role: "no" },
  { id: 2, number: 2, name: "Pameris Pameran Dikjut", points: 20, requires_role: "no" },
  { id: 3, number: 3, name: "Panitia Pameran Dikjut", points: 20, requires_role: "yes" },
  { id: 4, number: 4, name: "Piket Sekre Akbar", points: 10, requires_role: "no" },
  { id: 5, number: 5, name: "Diklat Wajib & Umum", points: 10, requires_role: "no" },
  { id: 6, number: 6, name: "Ketua Kelas Pameran Pra Pelantikan", points: 5, requires_role: "yes" },
  { id: 7, number: 7, name: "Event Hunting", points: 10, requires_role: "no" },
  { id: 8, number: 8, name: "Piket Sekre", points: 10, requires_role: "no" },
  { id: 9, number: 9, name: "Ikut Presentasi Karya Pameris (Pra-pel)", points: 3, requires_role: "no" },
  { id: 10, number: 10, name: "Menjadi Divisi DDD di kepanitiaan", points: 5, requires_role: "yes" },
  { id: 11, number: 11, name: "Memenangkan Lomba Fotografi/Videografi", points: 10, requires_role: "no" },
  { id: 12, number: 12, name: "Mengikuti Lomba Fotografi/Videografi", points: 2, requires_role: "no" },
  { id: 13, number: 13, name: "Submit Karya untuk pameran", points: 3, requires_role: "no" },
  { id: 14, number: 14, name: "Membantu dokumentasi UKM/komunitas di UGM", points: 3, requires_role: "no" },
  { id: 15, number: 15, name: "Berpartisipasi Dalam Kegiatan HUT UFO", points: 2, requires_role: "no" },
  { id: 16, number: 16, name: "Kurasi Pameran", points: 3, requires_role: "no" },
  { id: 17, number: 17, name: "Hunting individu", points: 2, requires_role: "no" },
  { id: 18, number: 18, name: "Hunting bareng UFO/CUFO (min. 3 orang)", points: 5, requires_role: "no" },
  { id: 19, number: 19, name: "Main ke Sekre UFO (min. 2 jam)", points: 2, requires_role: "no" },
  { id: 20, number: 20, name: "Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)", points: 5, requires_role: "no" },
  { id: 21, number: 21, name: "Mengunjungi Pameran", points: 2, requires_role: "no" },
  { id: 22, number: 22, name: "Mengunjungi Pameran bersama UFO/CUFO", points: 5, requires_role: "no" },
  { id: 23, number: 23, name: "Mengikuti One Week Challenge (poin per hari)", points: 1, requires_role: "no" },
  { id: 24, number: 24, name: "Kegiatan lain sesuai kebijakan Ketua UFO", points: 0, requires_role: "no" },
];

export function useSupabaseData() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // ─── Activity Types (static) ────────────────────────────────────
  const getActivityTypes = useCallback(async () => {
    if (IS_DEMO) return ACTIVITY_TYPES;
    const { data } = await supabase.from("activity_types").select("*").order("number");
    return (data as DbActivityType[]) || ACTIVITY_TYPES;
  }, []);

  // ─── Registrants ────────────────────────────────────────────────
  const getRegistrants = useCallback(async () => {
    if (IS_DEMO) return [];
    const { data } = await supabase.from("registrants").select("*").order("full_name");
    return (data as DbRegistrant[]) || [];
  }, [tick]);

  const getRegistrantByEmail = useCallback(async (email: string) => {
    if (IS_DEMO) return null;
    const { data } = await supabase.from("registrants").select("*").eq("email", email).single();
    return (data as DbRegistrant) || null;
  }, [tick]);

  const getRegistrantById = useCallback(async (id: number) => {
    if (IS_DEMO) return null;
    const { data } = await supabase.from("registrants").select("*").eq("id", id).single();
    return (data as DbRegistrant) || null;
  }, [tick]);

  const createRegistrant = useCallback(async (registrant: Omit<DbRegistrant, "id" | "created_at" | "status">) => {
    if (IS_DEMO) return null;
    const { data, error } = await supabase
      .from("registrants")
      .insert({ ...registrant, status: "active" })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    refresh();
    return data as DbRegistrant;
  }, []);

  // ─── Mentors ────────────────────────────────────────────────────
  const getMentors = useCallback(async () => {
    if (IS_DEMO) return [];
    const { data } = await supabase.from("mentors").select("*").order("full_name");
    return (data as DbMentor[]) || [];
  }, [tick]);

  const getMentorByUserId = useCallback(async (userId: number) => {
    if (IS_DEMO) return null;
    const { data } = await supabase.from("mentors").select("*").eq("user_id", userId).single();
    return (data as DbMentor) || null;
  }, [tick]);

  // ─── Activities ─────────────────────────────────────────────────
  const getActivitiesByRegistrant = useCallback(async (registrantId: number) => {
    if (IS_DEMO) return [];
    const { data } = await supabase
      .from("activities")
      .select("*, activity_types(name)")
      .eq("registrant_id", registrantId)
      .order("submitted_at", { ascending: false });
    return (data as any[])?.map((a) => ({
      ...a,
      activity_type_name: a.activity_types?.name,
    })) || [];
  }, [tick]);

  const getPendingActivitiesForMentor = useCallback(async (mentorId: number) => {
    if (IS_DEMO) return [];
    // Get mentor's CUFOs
    const { data: assignments } = await supabase
      .from("mentor_assignments")
      .select("registrant_id")
      .eq("mentor_id", mentorId);
    if (!assignments?.length) return [];
    const cufoIds = assignments.map((a) => a.registrant_id);
    const { data } = await supabase
      .from("activities")
      .select("*, activity_types(name), registrants(full_name)")
      .eq("status", "pending")
      .in("registrant_id", cufoIds)
      .order("submitted_at", { ascending: false });
    return (data as any[])?.map((a) => ({
      ...a,
      activity_type_name: a.activity_types?.name,
      registrant_name: a.registrants?.full_name,
    })) || [];
  }, [tick]);

  const getAllActivities = useCallback(async () => {
    if (IS_DEMO) return [];
    const { data } = await supabase
      .from("activities")
      .select("*, activity_types(name), registrants(full_name)")
      .order("submitted_at", { ascending: false })
      .limit(50);
    return (data as any[])?.map((a) => ({
      ...a,
      activity_type_name: a.activity_types?.name,
      registrant_name: a.registrants?.full_name,
    })) || [];
  }, [tick]);

  const createActivity = useCallback(async (activity: Omit<DbActivity, "id" | "submitted_at" | "status">) => {
    if (IS_DEMO) return null;
    const { data, error } = await supabase
      .from("activities")
      .insert({ ...activity, status: "pending" })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    refresh();
    return data as DbActivity;
  }, []);

  const verifyActivity = useCallback(async (activityId: number, action: "approved" | "rejected", notes?: string, mentorId?: number) => {
    if (IS_DEMO) return;
    await supabase
      .from("activities")
      .update({
        status: action === "approved" ? "verified" : "rejected",
        notes: notes || null,
        verified_at: action === "approved" ? new Date().toISOString() : null,
        verified_by: mentorId || null,
      })
      .eq("id", activityId);
    refresh();
  }, []);

  const getPointSummary = useCallback(async (registrantId: number) => {
    if (IS_DEMO) return { total: 0, verified: 0, pending: 0, rejected: 0, count: 0 };
    const { data } = await supabase
      .from("activities")
      .select("points, status")
      .eq("registrant_id", registrantId);
    const acts = data || [];
    return {
      total: acts.reduce((s: number, a: any) => s + (a.points || 0), 0),
      verified: acts.filter((a: any) => a.status === "verified").reduce((s: number, a: any) => s + (a.points || 0), 0),
      pending: acts.filter((a: any) => a.status === "pending").reduce((s: number, a: any) => s + (a.points || 0), 0),
      rejected: acts.filter((a: any) => a.status === "rejected").reduce((s: number, a: any) => s + (a.points || 0), 0),
      count: acts.length,
    };
  }, [tick]);

  // ─── Mentor Assignments ─────────────────────────────────────────
  const getMentorAssignments = useCallback(async () => {
    if (IS_DEMO) return [];
    const { data } = await supabase
      .from("mentor_assignments")
      .select("*, mentors(full_name, email), registrants(full_name, email, year, major)")
      .order("assigned_at", { ascending: false });
    return (data as any[])?.map((a) => ({
      ...a,
      mentor_name: a.mentors?.full_name,
      mentor_email: a.mentors?.email,
      registrant_name: a.registrants?.full_name,
      registrant_email: a.registrants?.email,
      registrant_year: a.registrants?.year,
      registrant_major: a.registrants?.major,
    })) || [];
  }, [tick]);

  const getCUFOByMentor = useCallback(async (mentorId: number) => {
    if (IS_DEMO) return [];
    const { data } = await supabase
      .from("mentor_assignments")
      .select("*, registrants(full_name, email, year, major)")
      .eq("mentor_id", mentorId);
    return (data as any[])?.map((a) => ({
      assignment_id: a.id,
      registrant_id: a.registrant_id,
      registrant_name: a.registrants?.full_name,
      registrant_email: a.registrants?.email,
      registrant_year: a.registrants?.year,
      registrant_major: a.registrants?.major,
    })) || [];
  }, [tick]);
  /** @deprecated Use getCUFOByMentor */
  const getMenteesByMentor = getCUFOByMentor;

  const getUnassignedRegistrants = useCallback(async () => {
    if (IS_DEMO) return [];
    // Get all registrant IDs that have assignments
    const { data: assigned } = await supabase.from("mentor_assignments").select("registrant_id");
    const assignedIds = (assigned || []).map((a) => a.registrant_id);
    if (assignedIds.length === 0) {
      const { data } = await supabase.from("registrants").select("*").eq("status", "active").order("full_name");
      return (data as DbRegistrant[]) || [];
    }
    const { data } = await supabase
      .from("registrants")
      .select("*")
      .eq("status", "active")
      .not("id", "in", `(${assignedIds.join(",")})`)
      .order("full_name");
    return (data as DbRegistrant[]) || [];
  }, [tick]);

  const createAssignment = useCallback(async (mentorId: number, registrantId: number) => {
    if (IS_DEMO) return;
    // Delete existing assignment for this registrant
    await supabase.from("mentor_assignments").delete().eq("registrant_id", registrantId);
    // Create new
    await supabase.from("mentor_assignments").insert({ mentor_id: mentorId, registrant_id: registrantId });
    refresh();
  }, []);

  const deleteAssignment = useCallback(async (assignmentId: number) => {
    if (IS_DEMO) return;
    await supabase.from("mentor_assignments").delete().eq("id", assignmentId);
    refresh();
  }, []);

  // ─── Stats ──────────────────────────────────────────────────────
  const getStats = useCallback(async () => {
    if (IS_DEMO) return { registrants: 0, mentors: 0, activities: 0, pending: 0, verified: 0, totalPoints: 0 };
    const [
      { count: regCount },
      { count: mentorCount },
      { count: actCount },
      { count: pendingCount },
      { count: verifiedCount },
      { data: pointsData },
    ] = await Promise.all([
      supabase.from("registrants").select("*", { count: "exact", head: true }),
      supabase.from("mentors").select("*", { count: "exact", head: true }),
      supabase.from("activities").select("*", { count: "exact", head: true }),
      supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "verified"),
      supabase.from("activities").select("points").eq("status", "verified"),
    ]);
    return {
      registrants: regCount || 0,
      mentors: mentorCount || 0,
      activities: actCount || 0,
      pending: pendingCount || 0,
      verified: verifiedCount || 0,
      totalPoints: (pointsData || []).reduce((s: number, a: any) => s + (a.points || 0), 0),
    };
  }, [tick]);

  // ─── Leaderboard ────────────────────────────────────────────────
  const getLeaderboard = useCallback(async (limit = 5) => {
    if (IS_DEMO) return [];
    const { data } = await supabase
      .from("activities")
      .select("registrant_id, points, status, registrants(full_name, year, major)")
      .eq("status", "verified");
    if (!data) return [];
    // Aggregate by registrant
    const byRegistrant: Record<number, { name: string; year: string; major: string; points: number; count: number }> = {};
    data.forEach((a: any) => {
      const rid = a.registrant_id;
      if (!byRegistrant[rid]) {
        byRegistrant[rid] = {
          name: a.registrants?.full_name || "-",
          year: a.registrants?.year || "",
          major: a.registrants?.major || "",
          points: 0,
          count: 0,
        };
      }
      byRegistrant[rid].points += a.points || 0;
      byRegistrant[rid].count += 1;
    });
    return Object.values(byRegistrant)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }, [tick]);

  // ─── Photo Upload ───────────────────────────────────────────────
  const uploadPhoto = useCallback(async (file: File, path?: string) => {
    if (IS_DEMO) {
      // Return base64 for demo
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    const filePath = path || `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("activity-photos").upload(filePath, file);
    if (error) { console.error(error); return null; }
    const { data: urlData } = supabase.storage.from("activity-photos").getPublicUrl(data.path);
    return urlData.publicUrl;
  }, []);

  return {
    tick,
    refresh,
    activityTypes: ACTIVITY_TYPES,
    getActivityTypes,
    getRegistrants,
    getRegistrantByEmail,
    getRegistrantById,
    createRegistrant,
    getMentors,
    getMentorByUserId,
    getActivitiesByRegistrant,
    getPendingActivitiesForMentor,
    getAllActivities,
    createActivity,
    verifyActivity,
    getPointSummary,
    getMentorAssignments,
    getMenteesByMentor,
    getUnassignedRegistrants,
    createAssignment,
    deleteAssignment,
    getStats,
    getLeaderboard,
    uploadPhoto,
  };
}
