import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

// GET - Fetch user's in-progress games
export const GET: RequestHandler = async ({ locals }) => {
  // @ts-expect-error - safeGetSession exists on locals at runtime
  const { user } = await locals.safeGetSession();

  if (!user) {
    return json({ games: [] });
  }

  const { data: games, error: fetchError } = await supabase
    .from('game_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .order('last_played_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching game progress:', fetchError);
    return error(500, { message: 'Failed to fetch game progress' });
  }

  return json({ games: games || [] });
};

// POST - Create or update game progress
export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - safeGetSession exists on locals at runtime
  const { user } = await locals.safeGetSession();

  if (!user) {
    return error(401, { message: 'Must be logged in to save game progress' });
  }

  const data = await request.json();
  const {
    id,
    dialect,
    category,
    gameMode,
    currentIndex,
    totalQuestions,
    score,
    wordsToReview,
    questionOrder,
    status
  } = data;

  // Validate required fields
  if (!dialect || !category || !gameMode) {
    return error(400, { message: 'Missing required fields' });
  }

  const now = Date.now();

  // If id is provided, update existing game
  if (id) {
    const updateData: Record<string, any> = {
      current_index: currentIndex,
      score: score,
      words_to_review: wordsToReview || [],
      last_played_at: now,
      status: status || 'in_progress'
    };

    if (status === 'completed') {
      updateData.completed_at = now;
    }

    const { data: updated, error: updateError } = await supabase
      .from('game_progress')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating game progress:', updateError);
      return error(500, { message: 'Failed to update game progress' });
    }

    return json({ game: updated });
  }

  // Check if there's an existing game for this category/mode
  const { data: existing } = await supabase
    .from('game_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('dialect', dialect)
    .eq('category', category)
    .eq('game_mode', gameMode)
    .single();

  // If exists, delete it first (user is starting fresh)
  if (existing) {
    await supabase
      .from('game_progress')
      .delete()
      .eq('id', existing.id);
  }

  // Create new game progress
  const newId = crypto.randomUUID();
  const { data: created, error: createError } = await supabase
    .from('game_progress')
    .insert({
      id: newId,
      user_id: user.id,
      dialect,
      category,
      game_mode: gameMode,
      current_index: currentIndex || 0,
      total_questions: totalQuestions,
      score: score || 0,
      words_to_review: wordsToReview || [],
      question_order: questionOrder,
      status: 'in_progress',
      started_at: now,
      last_played_at: now
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating game progress:', createError);
    return error(500, { message: 'Failed to create game progress' });
  }

  return json({ game: created });
};

// DELETE - Delete a game progress
export const DELETE: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - safeGetSession exists on locals at runtime
  const { user } = await locals.safeGetSession();

  if (!user) {
    return error(401, { message: 'Must be logged in' });
  }

  const { id } = await request.json();

  if (!id) {
    return error(400, { message: 'Missing game id' });
  }

  const { error: deleteError } = await supabase
    .from('game_progress')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting game progress:', deleteError);
    return error(500, { message: 'Failed to delete game progress' });
  }

  return json({ success: true });
};
