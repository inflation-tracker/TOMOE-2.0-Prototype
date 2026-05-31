'use client'
import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  selectedRegion: string
  selectedCommodity: number
  activeAlerts: number
  toggleSidebar: () => void
  setRegion: (region: string) => void
  setCommodity: (id: number) => void
  setActiveAlerts: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  selectedRegion: 'Nasional',
  selectedCommodity: 1,
  activeAlerts: 3,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setRegion: (region) => set({ selectedRegion: region }),
  setCommodity: (id) => set({ selectedCommodity: id }),
  setActiveAlerts: (count) => set({ activeAlerts: count }),
}))
