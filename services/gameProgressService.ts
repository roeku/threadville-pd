import { supabase } from './supabase';
import { EvidenceLink } from '../types/deduction';
import { CaseFile } from '../types';

const USER_PROFILE_KEY = 'cold-case-user-profile-id';

/**
 * Get or create anonymous user profile
 * Stores UUID in localStorage for persistence
 */
export async function getOrCreateUserProfile(): Promise<string> {
  // Check localStorage for existing profile ID
  const existingProfileId = localStorage.getItem(USER_PROFILE_KEY);
  
  if (existingProfileId) {
    // Verify it exists in database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', existingProfileId)
      .single();
    
    if (data && !error) {
      // Update last active timestamp
      await supabase
        .from('user_profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', existingProfileId);
      
      return existingProfileId;
    }
  }
  
  // Create new profile
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({})
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create user profile:', error);
    throw error;
  }
  
  // Store in localStorage
  localStorage.setItem(USER_PROFILE_KEY, data.id);
  
  return data.id;
}

/**
 * Start a new case session
 */
export async function startCaseSession(caseFile: CaseFile): Promise<string> {
  const profileId = await getOrCreateUserProfile();
  
  const { data, error } = await supabase
    .from('case_sessions')
    .insert({
      user_profile_id: profileId,
      case_id: caseFile.caseId,
      case_title: caseFile.title,
      difficulty: caseFile.difficulty,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to start case session:', error);
    throw error;
  }
  
  return data.id;
}

/**
 * Complete a case session
 */
export async function completeCaseSession(
  sessionId: string, 
  solved: boolean, 
  startTime: number
): Promise<void> {
  const completedAt = new Date().toISOString();
  const timeToComplete = Math.floor((Date.now() - startTime) / 1000); // seconds
  
  const { error } = await supabase
    .from('case_sessions')
    .update({
      completed_at: completedAt,
      solved,
      time_to_complete_seconds: timeToComplete,
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Failed to complete case session:', error);
    throw error;
  }
  
  // Update user profile stats
  if (solved) {
    const profileId = await getOrCreateUserProfile();
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('total_cases_completed, total_play_time_seconds')
      .eq('id', profileId)
      .single();
    
    if (profile) {
      await supabase
        .from('user_profiles')
        .update({
          total_cases_completed: (profile.total_cases_completed || 0) + 1,
          total_play_time_seconds: (profile.total_play_time_seconds || 0) + timeToComplete,
        })
        .eq('id', profileId);
    }
  }
}

/**
 * Track a connection being made or removed
 */
export async function trackConnection(
  sessionId: string,
  link: EvidenceLink,
  fromLabel: string,
  toLabel: string,
  isCritical: boolean = false,
  removed: boolean = false
): Promise<void> {
  if (removed) {
    // Mark as removed
    const { error } = await supabase
      .from('session_connections')
      .update({ removed_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('from_id', link.fromId)
      .eq('to_id', link.toId)
      .is('removed_at', null);
    
    if (error) {
      console.error('Failed to mark connection as removed:', error);
    }
  } else {
    // Add new connection
    const { error } = await supabase
      .from('session_connections')
      .insert({
        session_id: sessionId,
        from_id: link.fromId,
        from_label: fromLabel,
        to_id: link.toId,
        to_label: toLabel,
        link_type: link.type,
        is_valid: link.status === 'VALID',
        is_critical: isCritical,
      });
    
    if (error) {
      console.error('Failed to track connection:', error);
    }
  }
}

/**
 * Track a document being printed
 */
export async function trackDocumentPrint(
  sessionId: string,
  documentId: string,
  documentLabel: string,
  documentType: string
): Promise<void> {
  const { error } = await supabase
    .from('session_documents')
    .insert({
      session_id: sessionId,
      document_id: documentId,
      document_label: documentLabel,
      document_type: documentType,
    });
  
  if (error) {
    console.error('Failed to track document print:', error);
  }
}

/**
 * Track OS puzzle/app interaction
 */
export async function trackPuzzleInteraction(
  sessionId: string,
  puzzleType: string,
  evidenceId: string,
  evidenceLabel: string,
  solved: boolean = false
): Promise<void> {
  // Check if puzzle already exists
  const { data: existing } = await supabase
    .from('session_puzzles')
    .select('id, attempts, time_spent_seconds')
    .eq('session_id', sessionId)
    .eq('puzzle_type', puzzleType)
    .eq('evidence_id', evidenceId)
    .single();
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('session_puzzles')
      .update({
        solved,
        attempts: (existing.attempts || 0) + 1,
        completed_at: solved ? new Date().toISOString() : null,
      })
      .eq('id', existing.id);
    
    if (error) {
      console.error('Failed to update puzzle interaction:', error);
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('session_puzzles')
      .insert({
        session_id: sessionId,
        puzzle_type: puzzleType,
        evidence_id: evidenceId,
        evidence_label: evidenceLabel,
        solved,
        attempts: 1,
        completed_at: solved ? new Date().toISOString() : null,
      });
    
    if (error) {
      console.error('Failed to track puzzle interaction:', error);
    }
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalCasesCompleted: number;
  totalPlayTimeSeconds: number;
  recentSessions: any[];
} | null> {
  const profileId = localStorage.getItem(USER_PROFILE_KEY);
  
  if (!profileId) return null;
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_cases_completed, total_play_time_seconds')
    .eq('id', profileId)
    .single();
  
  const { data: sessions } = await supabase
    .from('case_sessions')
    .select('*')
    .eq('user_profile_id', profileId)
    .order('started_at', { ascending: false })
    .limit(10);
  
  return {
    totalCasesCompleted: profile?.total_cases_completed || 0,
    totalPlayTimeSeconds: profile?.total_play_time_seconds || 0,
    recentSessions: sessions || [],
  };
}

/**
 * Get detailed session report
 */
export async function getSessionReport(sessionId: string) {
  const { data: session } = await supabase
    .from('case_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  const { data: connections } = await supabase
    .from('session_connections')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  const { data: documents } = await supabase
    .from('session_documents')
    .select('*')
    .eq('session_id', sessionId)
    .order('printed_at', { ascending: true });
  
  const { data: puzzles } = await supabase
    .from('session_puzzles')
    .select('*')
    .eq('session_id', sessionId)
    .order('completed_at', { ascending: true });
  
  return {
    session,
    connections: connections || [],
    documents: documents || [],
    puzzles: puzzles || [],
  };
}
