
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WikimediaResponse {
  query: {
    pages: {
      [key: string]: {
        title: string;
        imageinfo?: Array<{
          url: string;
          descriptionurl: string;
        }>;
      };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchQuery } = await req.json()
    
    if (!searchQuery) {
      throw new Error('Search query is required')
    }

    // URL encode the search query and format it for the Wikimedia API
    const encodedQuery = encodeURIComponent(searchQuery)
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQuery}&gsrlimit=10&prop=imageinfo&iiprop=url&format=json&gsrnamespace=6`

    const response = await fetch(apiUrl)
    const data: WikimediaResponse = await response.json()

    // Process the response to get image URLs
    const images = data.query?.pages ? 
      Object.values(data.query.pages)
        .filter(page => page.imageinfo?.[0]?.url)
        .map(page => ({
          title: page.title,
          url: page.imageinfo![0].url
        })) : []

    return new Response(
      JSON.stringify({ images }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
