import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  PhoneCall,
  MessageSquare,
  Car,
  Video,
  DollarSign,
  MapPin,
  FileCheck2,
  Filter,
  UserCheck,
} from 'lucide-react';
import { useTimeline } from '../../hooks/useIntelligenceApi';
import { EventType } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';

export function TimelinePage() {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const { data: events, isLoading } = useTimeline('ALL');

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-4 w-4 text-amber-400" />;
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'VEHICLE_DETECTION':
        return <Car className="h-4 w-4 text-purple-400" />;
      case 'CCTV_SIGHTING':
        return <Video className="h-4 w-4 text-indigo-400" />;
      case 'BANK_TRANSFER':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'LOCATION_PING':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      case 'EVIDENCE_UPLOAD':
        return <FileCheck2 className="h-4 w-4 text-primary" />;
      case 'INVESTIGATOR_ACTION':
      default:
        return <UserCheck className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredEvents = events?.filter(
    (e) => eventTypeFilter === 'ALL' || e.eventType === eventTypeFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Chronological Investigation Event Stream
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Temporal event stream tracking phone calls, wire transfers, vehicle ANPR sightings, and investigator actions.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-4 rounded-xl border border-border bg-card">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        <span className="text-xs font-semibold text-muted-foreground">Event Type:</span>
        {[
          'ALL',
          'CALL',
          'BANK_TRANSFER',
          'VEHICLE_DETECTION',
          'CCTV_SIGHTING',
          'EVIDENCE_UPLOAD',
          'INVESTIGATOR_ACTION',
        ].map((t) => (
          <button
            key={t}
            onClick={() => setEventTypeFilter(t)}
            className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition-colors ${
              eventTypeFilter === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading event stream...</div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
          {filteredEvents?.map((evt) => (
            <div key={evt.id} className="relative flex items-start gap-4 group">
              <div className="absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-card border-2 border-primary shadow-sm">
                {getEventIcon(evt.eventType)}
              </div>

              <Card className="flex-1 hover:border-primary/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{evt.entityName}</span>
                    <Badge variant="outline">{evt.eventType}</Badge>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{formatDate(evt.timestamp)}</span>
                </CardHeader>

                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground leading-relaxed">{evt.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                    {evt.location && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 text-pink-400" />
                        {evt.location}
                      </span>
                    )}

                    {evt.evidenceId && (
                      <Link to={`/evidence/${evt.evidenceId}`} className="text-primary font-semibold hover:underline">
                        Linked Evidence ({evt.evidenceId}) &rarr;
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
