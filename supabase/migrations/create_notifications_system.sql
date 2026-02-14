-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL, -- 'quote_received', 'emergency_dispatch', 'booking_confirmed', 'service_completed'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  related_id UUID, -- ID of related entity (quote_id, emergency_id, booking_id, etc.)
  related_type TEXT, -- 'quote', 'emergency', 'booking', 'transaction'
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Action URL
  action_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  data JSONB
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new quote
CREATE OR REPLACE FUNCTION notify_quote_received()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, data)
  SELECT 
    mj.user_id,
    'quote_received',
    'New Quote Received',
    FORMAT('You received a quote for $%s from %s', (NEW.quoted_price / 100.0)::numeric(10,2), b.name),
    NEW.id,
    'quote',
    '/assistant',
    jsonb_build_object(
      'quote_id', NEW.id,
      'job_id', NEW.job_id,
      'business_id', NEW.business_id,
      'quoted_price', NEW.quoted_price
    )
  FROM marketplace_jobs mj
  JOIN businesses b ON b.id = NEW.business_id
  WHERE mj.id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new quotes
DROP TRIGGER IF EXISTS on_quote_created ON marketplace_quotes;
CREATE TRIGGER on_quote_created
  AFTER INSERT ON marketplace_quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_received();

-- Function to notify businesses of emergency dispatch
CREATE OR REPLACE FUNCTION notify_emergency_dispatch()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when status changes to 'dispatched'
  IF NEW.status = 'dispatched' AND OLD.status != 'dispatched' THEN
    -- Notify the business owner
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, data)
    SELECT 
      b.owner_id,
      'emergency_dispatch',
      '🚨 EMERGENCY REQUEST',
      FORMAT('New %s emergency at %s', REPLACE(NEW.emergency_type, '_', ' '), NEW.address),
      NEW.id,
      'emergency',
      '/business/dashboard',
      jsonb_build_object(
        'emergency_id', NEW.id,
        'emergency_type', NEW.emergency_type,
        'latitude', NEW.latitude,
        'longitude', NEW.longitude,
        'priority', NEW.priority
      )
    FROM businesses b
    WHERE b.id = NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for emergency dispatch
DROP TRIGGER IF EXISTS on_emergency_dispatched ON emergency_requests;
CREATE TRIGGER on_emergency_dispatched
  AFTER UPDATE ON emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_emergency_dispatch();

-- Function to clean up old notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE notifications IS 'Universal notification system for all user alerts';
COMMENT ON COLUMN notifications.type IS 'Type of notification: quote_received, emergency_dispatch, booking_confirmed, service_completed';
COMMENT ON COLUMN notifications.related_id IS 'UUID of the related entity (quote, emergency, booking, etc.)';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
