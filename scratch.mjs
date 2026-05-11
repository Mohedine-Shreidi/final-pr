import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pjxrevdvuxqlgmqlktmr.supabase.co';
const supabaseAnonKey = 'sb_publishable_i4PeXT24_BjaU8SougDuqw_tdrAmQSr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('reports').select('*').limit(1);
  if (error) {
    console.error('Error fetching reports:', error);
  } else {
    console.log('Reports fetched successfully!');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No reports found.');
    }
  }

  // Also try to insert a fake report
  const { data: insertData, error: insertError } = await supabase.from('reports').insert({
    title: 'Test',
    description: 'Test',
    category: 'roads',
    urgency: 'low',
    lat: 0,
    lng: 0,
    status: 'reported',
    is_confirmed: false
  }).select();

  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Insert success:', insertData);
    // clean up
    await supabase.from('reports').delete().eq('id', insertData[0].id);
  }
}

test();
