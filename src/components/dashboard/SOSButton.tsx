import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface SOSButtonProps {
  onPress: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onPress();
    
    // Reset animation after 3 seconds
    setTimeout(() => {
      setIsPressed(false);
    }, 3000);
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