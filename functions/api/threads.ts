// API to get threads from D1
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const channel = url.searchParams.get('channel');
    const limit = url.searchParams.get('limit');
    
    // Build query
    let query = 'SELECT * FROM threads WHERE 1=1';
    const bindings: any[] = [];
    
    if (status) {
      query += ' AND status = ?';
      bindings.push(status);
    }
    
    if (channel) {
      query += ' AND channel = ?';
      bindings.push(channel);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      bindings.push(parseInt(limit));
    }
    
    const result = await env.DB.prepare(query).bind(...bindings).all();
    
    return new Response(JSON.stringify({
      threads: result.results || [],
      success: true,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to get threads:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get threads',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
