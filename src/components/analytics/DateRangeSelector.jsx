import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { fr } from "date-fns/locale";

const PRESETS = [
  { label: '7 derniers jours', value: '7d', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: '30 derniers jours', value: '30d', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: '90 derniers jours', value: '90d', getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: 'Ce mois', value: 'month', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Mois dernier', value: 'lastMonth', getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Cette année', value: 'year', getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export default function DateRangeSelector({ value, onChange }) {
  const [preset, setPreset] = React.useState('30d');
  const [customRange, setCustomRange] = React.useState(null);

  const handlePresetChange = (presetValue) => {
    setPreset(presetValue);
    if (presetValue !== 'custom') {
      const presetConfig = PRESETS.find(p => p.value === presetValue);
      if (presetConfig) {
        onChange(presetConfig.getRange());
      }
    }
  };

  const handleCustomSelect = (range) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setPreset('custom');
      onChange(range);
    }
  };

  const displayValue = value ? 
    `${format(value.from, 'dd MMM', { locale: fr })} - ${format(value.to, 'dd MMM yyyy', { locale: fr })}` :
    'Sélectionner une période';

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
          <SelectItem value="custom">Personnalisé</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-start text-left">
              <CalendarDays className="w-4 h-4 mr-2" />
              {displayValue}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCustomSelect}
              numberOfMonths={2}
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}