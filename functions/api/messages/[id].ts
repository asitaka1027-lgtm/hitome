// API to get messages for a thread
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { params, env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const threadId = params.id as string;
    
    if (!threadId) {
      return new Response(JSON.stringify({ error: 'Thread ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get messages
    const result = await env.DB
      .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC')
      .bind(threadId)
      .all();
    
    return new Response(JSON.stringify({
      messages: result.results || [],
      success: true,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get messages',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
