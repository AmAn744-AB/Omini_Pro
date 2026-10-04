import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enokrfeebonzosulpavh.supabase.co';
const supabaseAnonKey = 'sb_publishable_V7uho8av8r0zpS6WiLTcpQ_HpVapfdw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type PrizeLine = 'first_5' | 'top_row' | 'middle_row' | 'bottom_row' | 'full_house' | 'four_corners' | 'ticket_corner' | 'sheet_corner' | 'full_house_1' | 'full_house_2' | 'full_house_3' | 'full_house_4';

export type PrizeConfig = {
  name: string;
  line: PrizeLine;
  amount: number;
};

export type OmniProGame = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  max_tickets: number;
  ticket_price: number;
  prizes_config: PrizeConfig[];
  drawn_numbers: number[];
  created_at: string;
  updated_at: string;
};

export type OmniProTicket = {
  id: string;
  user_id: string;
  game_id: string;
  ticket_number: string;
  grid: number[][];
  claimed_prizes: string[];
  status: 'unclaimed' | 'claimed' | 'winner';
  created_at: string;
};

export type OmniProDraw = {
  id: string;
  game_id: string;
  user_id: string;
  current_number: number | null;
  drawn_order: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TambolaSheet = {
  id: string;
  sheet_number: number;
  sheet_name: string;
  grids: number[][][];
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at?: string;
  updated_at?: string;
};
