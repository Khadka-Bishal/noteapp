import { create } from 'zustand';
import type { Annotation, RepeatedTermLink } from '../types/annotation';
import * as storage from '../services/storage/annotationStorage';

interface AnnotationState {
  annotations: Annotation[];
  repeatedTermLinks: RepeatedTermLink[];
  activeAnnotationId: string | null;

  // Actions
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  deleteAnnotation: (id: string) => void;
  setActiveAnnotation: (id: string | null) => void;
  setRepeatedTermLinks: (links: RepeatedTermLink[]) => void;
  addRepeatedTermLink: (link: RepeatedTermLink) => void;
  removeRepeatedTermLink: (id: string) => void;
  clearAll: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: [],
  repeatedTermLinks: [],
  activeAnnotationId: null,

  setAnnotations: (annotations) => set({ annotations }),

  addAnnotation: (annotation) => {
    set((s) => ({ annotations: [...s.annotations, annotation] }));
    storage.saveAnnotation(annotation);
  },

  updateAnnotation: (id, updates) => {
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }));
    storage.updateAnnotation(id, updates);
  },

  removeAnnotation: (id) => {
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      activeAnnotationId: s.activeAnnotationId === id ? null : s.activeAnnotationId,
    }));
    storage.deleteAnnotation(id);
  },

  deleteAnnotation: (id) => {
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      activeAnnotationId: s.activeAnnotationId === id ? null : s.activeAnnotationId,
    }));
    storage.deleteAnnotation(id);
  },

  setActiveAnnotation: (id) => set({ activeAnnotationId: id }),

  setRepeatedTermLinks: (repeatedTermLinks) => set({ repeatedTermLinks }),

  addRepeatedTermLink: (link) =>
    set((s) => ({ repeatedTermLinks: [...s.repeatedTermLinks, link] })),

  removeRepeatedTermLink: (id) =>
    set((s) => ({
      repeatedTermLinks: s.repeatedTermLinks.filter((l) => l.id !== id),
    })),

  clearAll: () => set({ annotations: [], repeatedTermLinks: [] }),
}));
