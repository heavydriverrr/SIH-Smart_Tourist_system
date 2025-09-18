import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Shield, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Phone,
  Globe,
  Download
} from 'lucide-react';

interface DigitalIDCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    digitalId: string;
    isVerified: boolean;
  };
  onClose: () => void;
}

const DigitalIDCard: React.FC<DigitalIDCardProps> = ({ user, onClose }) => {
  const currentDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(currentDate.getDate() + 30); // 30 days validity

  const handleDownload = () => {
    // Simulate download functionality
    alert('Digital ID downloaded successfully!');
  };

  const handleShare = () => {
    // Simulate sharing functionality
    if (navigator.share) {
      navigator.share({
        title: 'SmartShield Digital Tourist ID',
        text: `Digital Tourist ID: ${user.digitalId}`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`Digital Tourist ID: ${user.digitalId}`);
      alert('Digital ID copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm fade-in">
        <Card className="bg-gradient-hero border-0 shadow-card text-primary-foreground relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 h-32 w-32 border border-current rounded-full"></div>
            <div className="absolute bottom-4 left-4 h-16 w-16 border border-current rounded-full"></div>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>

          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">SmartShield</h2>
                <p className="text-primary-foreground/80 text-sm">Digital Tourist ID</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ID Number */}
            <div className="text-center">
              <div className="bg-primary-foreground/20 rounded-lg p-4">
                <p className="text-2xl font-mono font-bold tracking-wider">
                  {user.digitalId}
                </p>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Verified</span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-primary-foreground/80 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone || '+91 9876543210'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Assam, India</span>
                </div>
              </div>
            </div>

            {/* Validity */}
            <div className="bg-primary-foreground/10 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Valid Until</span>
                </div>
                <span className="font-semibold">
                  {expiryDate.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="text-center">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                Blockchain Verified ✓
              </Badge>
            </div>

            {/* QR Code Placeholder */}
            <div className="text-center">
              <div className="inline-block bg-primary-foreground p-4 rounded-lg">
                <div className="h-24 w-24 bg-primary rounded grid grid-cols-8 gap-px">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${Math.random() > 0.5 ? 'bg-primary-foreground' : 'bg-primary'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-primary-foreground/80 mt-2">
                Scan for verification
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30"
              >
                <Globe className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-primary-foreground/60">
              <p>Issued by Government of Assam</p>
              <p>Tourism Department</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalIDCard;