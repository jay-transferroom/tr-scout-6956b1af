import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import summitBannerBg from "@/assets/summit-banner-bg.png";

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
    <div 
      className="relative overflow-hidden rounded-xl bg-[#1a2744]"
      style={{
        backgroundImage: `url(${summitBannerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a2744]/95 via-[#1a2744]/80 to-transparent" />
      
      <div className="relative z-10 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-bold italic text-white">
              {title}
            </h3>
            <span className="text-white/60 text-lg">|</span>
            <span className="text-white font-semibold tracking-wide">
              {location}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              onClick={onRegister}
              className="bg-[#3A9D5C] hover:bg-[#2d7a47] text-white font-semibold px-5"
            >
              Register Interest
            </Button>
            
            <div className="flex items-center gap-1 text-white/90 text-sm bg-white/10 px-3 py-1.5 rounded-full">
              <MapPin className="h-4 w-4" />
              <span>{venue}</span>
            </div>
            
            <div className="text-white/90 font-medium px-3 py-1.5 rounded-full border border-white/30 text-sm">
              {dates}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSummitBanner;
