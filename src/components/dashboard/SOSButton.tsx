import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SOSButtonProps {
  onPress: () => void;
  userId?: string;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onPress, userId }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    setIsPressed(true);
    
    try {
      // Get current location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await sendSOSAlert(position.coords.latitude, position.coords.longitude);
        }, async () => {
          await sendSOSAlert(null, null);
        });
      } else {
        await sendSOSAlert(null, null);
      }
      
      onPress();
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      toast.error('Failed to send SOS alert');
    }
    
    // Reset animation after 3 seconds
    setTimeout(() => {
      setIsPressed(false);
    }, 3000);
  };

  const sendSOSAlert = async (latitude: number | null, longitude: number | null) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: userId,
          latitude,
          longitude,
          message: 'Emergency SOS alert triggered',
          status: 'active'
        });

      if (error) throw error;
      
      toast.success('SOS alert sent successfully!');
      console.log('SOS Alert sent with location:', { latitude, longitude });
    } catch (error) {
      console.error('Error saving SOS alert:', error);
      throw error;
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Button
        variant="sos"
        size="sos"
        onClick={handlePress}
        className={`
          relative overflow-hidden font-bold text-lg
          ${isPressed ? 'animate-pulse scale-110' : ''}
          shadow-emergency
        `}
      >
        <div className="flex flex-col items-center">
          <AlertTriangle className="h-8 w-8 mb-1" />
          <span className="text-xs">SOS</span>
        </div>
        
        {/* Ripple effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-emergency-foreground/20 animate-ping" />
        )}
      </Button>
      
      {/* Instruction text */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <p className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Press for Emergency
        </p>
      </div>
    </div>
  );
};

export default SOSButton;