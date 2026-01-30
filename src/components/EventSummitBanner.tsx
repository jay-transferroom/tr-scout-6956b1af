import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface EventSummitBannerProps {
  title?: string;
  location?: string;
  venue?: string;
  dates?: string;
  onRegister?: () => void;
}

const EventSummitBanner = ({
  title = "TransferRoom Summit",
  location = "BUENOS AIRES",
  venue = "Estadio Más Monumental",
  dates = "June 3-4",
  onRegister
}: EventSummitBannerProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 via-primary to-primary/80">
      {/* Background pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Soccer field pattern on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30">
        <svg viewBox="0 0 200 100" className="h-full w-full" preserveAspectRatio="xMaxYMid slice">
          <rect x="0" y="0" width="200" height="100" fill="none" stroke="white" strokeWidth="2"/>
          <circle cx="100" cy="50" r="20" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="2"/>
          <rect x="0" y="20" width="30" height="60" fill="none" stroke="white" strokeWidth="2"/>
          <rect x="170" y="20" width="30" height="60" fill="none" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      
      <div className="relative z-10 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-primary-foreground">
            {title}
          </h3>
          <span className="text-primary-foreground/60 text-lg">|</span>
          <span className="text-primary-foreground/90 font-semibold tracking-wide">
            {location}
          </span>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Button 
            onClick={onRegister}
            variant="secondary"
            className="font-semibold px-5"
          >
            Register Interest
          </Button>
          
          <div className="flex items-center gap-1 text-primary-foreground/90 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{venue}</span>
          </div>
          
          <div className="bg-background text-foreground font-bold px-4 py-1.5 rounded-lg text-sm">
            {dates}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSummitBanner;
