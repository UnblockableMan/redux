"use client";

import { X, GripVertical, Trash2, Play, Pause } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { artistsLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { YTMTrack } from "@/lib/ytm/types";
import { useEffect } from "react";

export function QueuePanel() {
  const open = usePlayer((s) => s.queueOpen);
  const setOpen = usePlayer((s) => s.setQueueOpen);
  const queue = usePlayer((s) => s.queue);
  const currentIndex = usePlayer((s) => s.currentIndex);
  const playTrackAt = usePlayer((s) => s.playTrackAt);
  const reorderQueue = usePlayer((s) => s.reorderQueue);
  const removeFromQueue = usePlayer((s) => s.removeFromQueue);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    reorderQueue(oldIndex, newIndex);
  };

  const upcoming = queue.map((t, i) => ({ t, i })).filter(({ i }) => i !== currentIndex);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-card/95 backdrop-blur-2xl fade-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold">Queue</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Now playing */}
        {queue[currentIndex] && (
          <div className="border-b border-white/10 p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Now playing
            </div>
            <QueueRow
              track={queue[currentIndex]}
              index={currentIndex}
              isCurrent
              onPlay={() => playTrackAt(currentIndex)}
            />
          </div>
        )}

        {/* Upcoming */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next up
          </div>
          {upcoming.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No upcoming tracks.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={upcoming.map(({ i }) => i)}
                strategy={verticalListSortingStrategy}
              >
                {upcoming.map(({ t, i }) => (
                  <SortableRow
                    key={t.videoId + i}
                    track={t}
                    index={i}
                    onPlay={() => playTrackAt(i)}
                    onRemove={() => removeFromQueue(i)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableRow({
  track,
  index,
  onPlay,
  onRemove,
}: {
  track: YTMTrack;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: index });
  const currentTrack = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isCurrent = currentTrack?.videoId === track.videoId;
  const active = isCurrent && isPlaying;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <QueueRow
        track={track}
        index={index}
        isCurrent={isCurrent}
        active={active}
        onPlay={onPlay}
        onRemove={onRemove}
      />
    </div>
  );
}

function QueueRow({
  track,
  isCurrent,
  active,
  onPlay,
  onRemove,
}: {
  track: YTMTrack;
  index: number;
  isCurrent?: boolean;
  active?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <button onClick={onPlay} className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-white/5">
        {track.thumbnail && (
          <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
        )}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {active ? (
            <Pause className="h-4 w-4 fill-current text-white" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px] fill-current text-white" />
          )}
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm",
            isCurrent ? "font-medium text-primary" : "font-medium",
          )}
        >
          {track.title}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {artistsLabel(track.artists)}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-none rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Remove from queue"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Re-export arrayMove for completeness (used internally by dnd-kit).
export { arrayMove };
