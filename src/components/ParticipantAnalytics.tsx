import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import type { Participant } from '@/types';

interface ParticipantAnalyticsProps {
  participants: Participant[];
}

export function ParticipantAnalytics({ participants }: ParticipantAnalyticsProps) {
  const unitStats = useMemo(() => {
    const stats = participants.reduce((acc, p) => {
      acc[p.unit] = (acc[p.unit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value
      }));
  }, [participants]);

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <Card className="p-6 bg-white/5 backdrop-blur-lg">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6" />
        <h2 className="text-2xl font-semibold">
          Total Peserta: {participants.length}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {unitStats.length > 0 ? (
          <div className="relative">
            <h3 className="text-xl font-medium mb-4">Statistik per Unit</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="40%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {unitStats.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{
                      paddingTop: "20px",
                      maxHeight: "150px",
                      overflowY: "auto"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] bg-white/10 rounded-lg">
            <p className="text-lg text-muted-foreground">
              Belum ada data statistik
            </p>
          </div>
        )}

        <div>
          <h3 className="text-xl font-medium mb-4">Daftar Peserta</h3>
          {participants.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {participants
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <div 
                      key={p.id} 
                      className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.unit}</div>
                    </div>
                  ))
                }
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[400px] bg-white/10 rounded-lg">
              <p className="text-lg text-muted-foreground">
                Belum ada peserta terdaftar
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}