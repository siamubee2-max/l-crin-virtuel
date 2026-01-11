import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amafgweelzayrjzemdtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYWZnd2VlbHpheXJqemVtZHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjI4MzgsImV4cCI6MjA4MTg5ODgzOH0.yg1jYRgrqDWMRCGHGEGR8C5jn7WmRTRC8U_1qtciDSk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Payment service for iOS/Android native payments
export const paymentService = {
  // Record a payment transaction
  async recordPayment({ userId, productId, amount, platform, transactionId, receipt }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        product_id: productId,
        amount: amount,
        platform: platform,
        transaction_id: transactionId,
        receipt: receipt,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create or update subscription
  async upsertSubscription({ userId, productId, platform, transactionId, status = 'active', expiresAt }) {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        product_id: productId,
        platform: platform,
        transaction_id: transactionId,
        status: status,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,product_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's active subscription
  async getActiveSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get user's payment history
  async getPaymentHistory(userId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Validate iOS receipt (to be called from backend Edge Function)
  async validateiOSReceipt(receipt) {
    const { data, error } = await supabase.functions.invoke('validate-ios-receipt', {
      body: { receipt }
    });
    if (error) throw error;
    return data;
  },

  // Validate Android purchase (to be called from backend Edge Function)
  async validateAndroidPurchase(purchaseToken, productId) {
    const { data, error } = await supabase.functions.invoke('validate-android-purchase', {
      body: { purchaseToken, productId }
    });
    if (error) throw error;
    return data;
  }
};
