import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings2, GripVertical, Eye, EyeOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_WIDGETS = [
  { id: 'revenue', label: 'Graphique Revenus', enabled: true },
  { id: 'clicks', label: 'Clics & Conversions', enabled: true },
  { id: 'engagement', label: 'Engagement', enabled: true },
  { id: 'categories', label: 'Répartition Catégories', enabled: true },
  { id: 'growth', label: 'Croissance Followers', enabled: true },
  { id: 'topProducts', label: 'Top Produits', enabled: true },
];

export function useWidgetConfig(storageKey = 'dashboard_widgets') {
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const saveWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    localStorage.setItem(storageKey, JSON.stringify(newWidgets));
  };

  const toggleWidget = (id) => {
    const updated = widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(updated);
  };

  const reorderWidgets = (startIndex, endIndex) => {
    const result = Array.from(widgets);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    saveWidgets(result);
  };

  const resetWidgets = () => {
    saveWidgets(DEFAULT_WIDGETS);
  };

  return { widgets, toggleWidget, reorderWidgets, resetWidgets };
}

export function WidgetConfigDialog({ widgets, onToggle, onReorder, onReset }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-2" />
          Personnaliser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personnaliser le Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-neutral-500">
            Activez/désactivez les widgets et réorganisez-les par glisser-déposer.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {widgets.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            snapshot.isDragging ? 'bg-neutral-50 shadow-lg' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="cursor-grab text-neutral-400 hover:text-neutral-600">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className={widget.enabled ? '' : 'text-neutral-400'}>
                              {widget.label}
                            </span>
                          </div>
                          <Switch
                            checked={widget.enabled}
                            onCheckedChange={() => onToggle(widget.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Button variant="ghost" size="sm" onClick={onReset} className="w-full mt-4">
            Réinitialiser par défaut
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TopProductsWidget({ data, title = "Top Produits" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.slice(0, 5).map((item, idx) => (
            <div key={item.id || idx} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-amber-100 text-amber-700' :
                idx === 1 ? 'bg-neutral-200 text-neutral-700' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-neutral-100 text-neutral-500'
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-neutral-500">{item.clicks} clics</p>
              </div>
              <p className="text-sm font-bold text-green-600">${item.revenue?.toFixed(2) || '0.00'}</p>
            </div>
          ))}
          
          {(!data || data.length === 0) && (
            <p className="text-sm text-neutral-400 text-center py-4">Aucune donnée disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}